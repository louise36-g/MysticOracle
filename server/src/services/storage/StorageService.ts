/**
 * Abstract storage service interface
 * Defines the contract for storage providers (Cloudinary, Local, etc.)
 */

export interface UploadOptions {
  folder: string;
  filename?: string;
  altText?: string;
  caption?: string;
}

export interface UploadResult {
  url: string;
  publicId: string | null;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
}

export interface DeleteResult {
  success: boolean;
  message?: string;
}

export interface StorageService {
  /**
   * Upload a file to storage
   * @param file - File buffer or path
   * @param originalName - Original filename
   * @param mimeType - MIME type of the file
   * @param options - Upload options (folder, alt text, etc.)
   */
  upload(
    file: Buffer | string,
    originalName: string,
    mimeType: string,
    options: UploadOptions
  ): Promise<UploadResult>;

  /**
   * Delete a file from storage
   * @param publicId - The public ID or path of the file
   */
  delete(publicId: string): Promise<DeleteResult>;

  /**
   * Get the provider name
   */
  getProviderName(): string;
}
