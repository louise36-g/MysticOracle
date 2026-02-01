/**
 * Media upload routes
 */

import { Router } from 'express';
import {
  prisma,
  cacheService,
  CacheService,
  upload,
  validateFolder,
  baseUploadDir,
  path,
  fs,
} from './shared.js';

const router = Router();

// Upload image
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get folder from request body, validate to prevent path traversal
    const folder = validateFolder(req.body.folder || 'blog');

    const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`;
    const url = `${baseUrl}/uploads/${folder}/${req.file.filename}`;

    const media = await prisma.mediaUpload.create({
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url,
        altText: req.body.altText || null,
        caption: req.body.caption || null,
        folder,
      },
    });

    // Invalidate media cache after successful upload
    await cacheService.flushPattern('media:');

    res.json({ success: true, media });
  } catch (error) {
    console.error('Error uploading file:', error instanceof Error ? error.message : String(error));
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// List media
router.get('/media', async (req, res) => {
  try {
    // Optional folder filter via query parameter, validate to prevent injection
    const folderParam = req.query.folder as string | undefined;
    const folder = folderParam ? validateFolder(folderParam) : undefined;
    const cacheKey = folder ? `media:list:${folder}` : 'media:list';

    // Check cache first
    const cached = await cacheService.get<Record<string, unknown>[]>(cacheKey);
    if (cached) {
      return res.json({ media: cached });
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
  } catch (error) {
    console.error('Error fetching media:', error instanceof Error ? error.message : String(error));
    res.status(500).json({ error: 'Failed to fetch media' });
  }
});

// Delete media
router.delete('/media/:id', async (req, res) => {
  try {
    const media = await prisma.mediaUpload.findUnique({ where: { id: req.params.id } });
    if (media) {
      // Delete file from disk using folder from DB record, validate to prevent path traversal
      const folder = validateFolder(media.folder);
      const folderPath = path.join(baseUploadDir, folder);
      const filePath = path.join(folderPath, media.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      await prisma.mediaUpload.delete({ where: { id: req.params.id } });

      // Invalidate media cache after successful delete
      await cacheService.flushPattern('media:');
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting media:', error instanceof Error ? error.message : String(error));
    res.status(500).json({ error: 'Failed to delete media' });
  }
});

export default router;
