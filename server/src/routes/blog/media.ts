/**
 * Media upload routes
 * Supports both Cloudinary and local storage based on STORAGE_PROVIDER env var
 */

import { Router } from 'express';
import {
  prisma,
  cacheService,
  CacheService,
  memoryUpload,
  validateFolder,
  baseUploadDir,
  path,
  fs,
} from './shared.js';
import { getStorageService } from '../../services/storage/index.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { ValidationError } from '../../shared/errors/ApplicationError.js';

const router = Router();

// Upload image
router.post(
  '/upload',
  memoryUpload.single('image'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new ValidationError('No file uploaded');
    }

    // Get folder from request body, validate to prevent path traversal
    const folder = validateFolder(req.body.folder || 'blog');

    const storageService = getStorageService();

    // Upload to storage provider
    const result = await storageService.upload(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      {
        folder,
        altText: req.body.altText || null,
        caption: req.body.caption || null,
      }
    );

    // Save to database
    const media = await prisma.mediaUpload.create({
      data: {
        filename: result.filename,
        originalName: result.originalName,
        mimeType: result.mimeType,
        size: result.size,
        url: result.url,
        publicId: result.publicId,
        provider: storageService.getProviderName(),
        altText: req.body.altText || null,
        caption: req.body.caption || null,
        folder,
      },
    });

    // Invalidate media cache after successful upload
    await cacheService.flushPattern('media:');

    res.json({ success: true, media });
  })
);

// List media
router.get(
  '/media',
  asyncHandler(async (req, res) => {
    // Optional folder filter via query parameter, validate to prevent injection
    const folderParam = req.query.folder as string | undefined;
    const folder = folderParam ? validateFolder(folderParam) : undefined;
    const cacheKey = folder ? `media:list:${folder}` : 'media:list';

    // Check cache first
    const cached = await cacheService.get<Record<string, unknown>[]>(cacheKey);
    if (cached) {
      res.json({ media: cached });
      return;
    }

    const where = folder ? { folder } : {};

    const media = await prisma.mediaUpload.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Cache result
    await cacheService.set(cacheKey, media, CacheService.TTL.MEDIA);

    res.json({ media });
  })
);

// Delete media
router.delete(
  '/media/:id',
  asyncHandler(async (req, res) => {
    const media = await prisma.mediaUpload.findUnique({
      where: { id: req.params.id },
    });

    if (media) {
      const storageService = getStorageService();
      const providerName = storageService.getProviderName();

      // Delete from storage
      if (media.provider === 'cloudinary' && media.publicId) {
        // Delete from Cloudinary using publicId
        await storageService.delete(media.publicId);
      } else if (media.provider === 'local' || !media.provider) {
        // Delete from local filesystem
        const folder = validateFolder(media.folder);
        const localPath = `${folder}/${media.filename}`;

        if (providerName === 'local') {
          await storageService.delete(localPath);
        } else {
          // Fallback: try to delete local file directly
          const filePath = path.join(baseUploadDir, folder, media.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      }

      // Delete database record
      await prisma.mediaUpload.delete({ where: { id: req.params.id } });

      // Invalidate media cache after successful delete
      await cacheService.flushPattern('media:');
    }

    res.json({ success: true });
  })
);

export default router;
