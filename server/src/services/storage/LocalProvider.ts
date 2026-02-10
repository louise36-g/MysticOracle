/**
 * Local filesystem storage provider implementation
 * Used for development or as fallback when Cloudinary is not configured
 */

import fs from 'fs';
import path from 'path';
import { StorageService, UploadOptions, UploadResult, DeleteResult } from './StorageService.js';

export class LocalProvider implements StorageService {
  private baseUploadDir: string;
  private baseUrl: string;

  constructor() {
    this.baseUploadDir = path.join(process.cwd(), 'public', 'uploads');
    this.baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`;

    // Ensure base directory exists
    if (!fs.existsSync(this.baseUploadDir)) {
      fs.mkdirSync(this.baseUploadDir, { recursive: true });
    }
  }

  async upload(
    file: Buffer | string,
    originalName: string,
    mimeType: string,
    options: UploadOptions
  ): Promise<UploadResult> {
    const folder = this.validateFolder(options.folder);
    const folderPath = path.join(this.baseUploadDir, folder);

    // Create folder if it doesn't exist
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    // Generate unique filename
    const sanitized = this.sanitizeFilename(originalName);
    const filename = this.getUniqueFilename(folderPath, sanitized);
    const filePath = path.join(folderPath, filename);

    // Write file
    if (Buffer.isBuffer(file)) {
      fs.writeFileSync(filePath, file);
    } else {
      // Copy from source path
      fs.copyFileSync(file, filePath);
    }

    const stats = fs.statSync(filePath);
    const url = `${this.baseUrl}/uploads/${folder}/${filename}`;

    return {
      url,
      publicId: null, // Local storage doesn't use public IDs
      filename,
      originalName,
      mimeType,
      size: stats.size,
    };
  }

  async delete(identifier: string): Promise<DeleteResult> {
    try {
      // identifier is expected to be "folder/filename" for local storage
      const filePath = path.join(this.baseUploadDir, identifier);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return { success: true };
      }

      return { success: true, message: 'File not found (already deleted)' };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: `Local delete failed: ${message}`,
      };
    }
  }

  getProviderName(): string {
    return 'local';
  }

  /**
   * Validate folder name to prevent path traversal attacks
   */
  private validateFolder(folder: string): string {
    if (
      !folder ||
      path.isAbsolute(folder) ||
      folder.includes('..') ||
      folder.includes('/') ||
      folder.includes('\\')
    ) {
      return 'blog';
    }
    return folder.replace(/[^a-z0-9-]/gi, '').toLowerCase() || 'blog';
  }

  /**
   * Sanitize filename for safe storage
   */
  private sanitizeFilename(filename: string): string {
    if (filename.includes('/') || filename.includes('\\') || filename.includes('\0')) {
      filename = filename.replace(/[/\\\0]/g, '-');
    }

    const ext = path.extname(filename).toLowerCase();
    const base = path.basename(filename, path.extname(filename));

    const sanitized = base
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    return `${sanitized || 'image'}${ext}`;
  }

  /**
   * Get unique filename by appending number suffix if needed
   */
  private getUniqueFilename(dir: string, filename: string): string {
    const ext = path.extname(filename);
    const base = path.basename(filename, ext);

    let finalName = filename;
    let counter = 1;
    const maxAttempts = 1000;

    while (fs.existsSync(path.join(dir, finalName)) && counter < maxAttempts) {
      finalName = `${base}-${counter}${ext}`;
      counter++;
    }

    if (counter >= maxAttempts) {
      finalName = `${base}-${Date.now()}${ext}`;
    }

    return finalName;
  }
}
