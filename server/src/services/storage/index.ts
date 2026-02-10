/**
 * Storage service factory and exports
 * Automatically selects provider based on STORAGE_PROVIDER env var
 */

import { StorageService } from './StorageService.js';
import { CloudinaryProvider } from './CloudinaryProvider.js';
import { LocalProvider } from './LocalProvider.js';

export type {
  StorageService,
  UploadOptions,
  UploadResult,
  DeleteResult,
} from './StorageService.js';
export { CloudinaryProvider } from './CloudinaryProvider.js';
export { LocalProvider } from './LocalProvider.js';

let storageServiceInstance: StorageService | null = null;

/**
 * Get the configured storage service instance (singleton)
 */
export function getStorageService(): StorageService {
  if (storageServiceInstance) {
    return storageServiceInstance;
  }

  const provider = process.env.STORAGE_PROVIDER || 'local';

  if (provider === 'cloudinary') {
    // Check if Cloudinary is configured
    if (
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    ) {
      console.log('[Storage] Using Cloudinary provider');
      storageServiceInstance = new CloudinaryProvider();
    } else {
      console.warn(
        '[Storage] STORAGE_PROVIDER=cloudinary but credentials not set. Falling back to local storage.'
      );
      storageServiceInstance = new LocalProvider();
    }
  } else {
    console.log('[Storage] Using local filesystem provider');
    storageServiceInstance = new LocalProvider();
  }

  return storageServiceInstance;
}

/**
 * Reset the storage service instance (for testing)
 */
export function resetStorageService(): void {
  storageServiceInstance = null;
}
