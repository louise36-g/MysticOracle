/**
 * Cloudinary storage provider implementation
 */

import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { StorageService, UploadOptions, UploadResult, DeleteResult } from './StorageService.js';

export class CloudinaryProvider implements StorageService {
  private baseFolder: string;

  constructor() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error(
        'Cloudinary credentials not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.'
      );
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    this.baseFolder = process.env.CLOUDINARY_BASE_FOLDER || 'celestiarcana';
  }

  async upload(
    file: Buffer | string,
    originalName: string,
    mimeType: string,
    options: UploadOptions
  ): Promise<UploadResult> {
    const folder = `${this.baseFolder}/${options.folder}`;

    // Generate a clean filename without extension (Cloudinary adds it)
    const filename = options.filename || this.generateFilename(originalName);

    try {
      let result: UploadApiResponse;

      if (Buffer.isBuffer(file)) {
        // Upload from buffer
        result = await new Promise<UploadApiResponse>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder,
              public_id: filename,
              resource_type: 'image',
              overwrite: false,
              unique_filename: true,
            },
            (error, uploadResult) => {
              if (error) {
                reject(error);
              } else if (uploadResult) {
                resolve(uploadResult);
              } else {
                reject(new Error('Upload failed: no result returned'));
              }
            }
          );

          uploadStream.end(file);
        });
      } else {
        // Upload from file path
        result = await cloudinary.uploader.upload(file, {
          folder,
          public_id: filename,
          resource_type: 'image',
          overwrite: false,
          unique_filename: true,
        });
      }

      return {
        url: result.secure_url,
        publicId: result.public_id,
        filename: result.public_id.split('/').pop() || filename,
        originalName,
        mimeType,
        size: result.bytes,
        width: result.width,
        height: result.height,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Cloudinary upload failed: ${message}`);
    }
  }

  async delete(publicId: string): Promise<DeleteResult> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);

      if (result.result === 'ok' || result.result === 'not found') {
        return { success: true };
      }

      return {
        success: false,
        message: `Delete failed: ${result.result}`,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: `Cloudinary delete failed: ${message}`,
      };
    }
  }

  getProviderName(): string {
    return 'cloudinary';
  }

  /**
   * Generate a clean filename from the original
   */
  private generateFilename(originalName: string): string {
    // Remove extension
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');

    // Sanitize: lowercase, replace spaces with hyphens, remove special chars
    return (
      nameWithoutExt
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 100) || 'image'
    );
  }
}
