/**
 * Content Services
 *
 * Re-exports all content-related services for easy importing.
 */

export {
  softDeleteItem,
  restoreItem,
  permanentDeleteItem,
  emptyTrash,
  type TrashConfig,
} from './TrashUtils.js';
