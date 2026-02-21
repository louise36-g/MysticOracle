/**
 * TrashUtils — Shared trash operations for soft delete, restore, permanent delete, and empty trash.
 * Used by both blog posts and tarot articles.
 */

/** Minimum fields required on a trashable record */
export interface TrashableItem {
  id: string;
  slug: string;
  originalSlug: string | null;
  deletedAt: Date | null;
}

/** Configuration for trash operations on a specific content type */
export interface TrashConfig {
  entityName: string;
  findUnique: (id: string) => Promise<TrashableItem | null>;
  updateItem: (id: string, data: Record<string, unknown>) => Promise<unknown>;
  deleteItem: (id: string) => Promise<unknown>;
  findSlugConflict: (slug: string, excludeId: string) => Promise<unknown | null>;
  deleteAllTrashed: () => Promise<{ count: number }>;
  /** Called after soft delete */
  onAfterSoftDelete?: (item: TrashableItem) => Promise<void>;
  /** Called after restore */
  onAfterRestore?: () => Promise<void>;
  /** Called before permanent delete (e.g., clean up junction tables) */
  onBeforePermanentDelete?: (id: string) => Promise<void>;
  /** Called before empty trash (e.g., clean up junction tables for all trashed items) */
  onBeforeEmptyTrash?: () => Promise<void>;
}

/**
 * Soft delete: rename slug to avoid conflicts, set deletedAt
 */
export async function softDeleteItem(config: TrashConfig, id: string) {
  const item = await config.findUnique(id);
  if (!item) {
    return { status: 404, body: { error: `${config.entityName} not found` } };
  }

  const timestamp = Date.now();
  const trashedSlug = `_deleted_${timestamp}_${item.slug}`;

  await config.updateItem(id, {
    deletedAt: new Date(),
    originalSlug: item.slug,
    slug: trashedSlug,
  });

  if (config.onAfterSoftDelete) {
    await config.onAfterSoftDelete(item);
  }

  return { status: 200, body: { success: true, message: `${config.entityName} moved to trash` } };
}

/**
 * Restore: put back original slug (with conflict resolution), clear deletedAt
 */
export async function restoreItem(config: TrashConfig, id: string) {
  const item = await config.findUnique(id);
  if (!item) {
    return { status: 404, body: { error: `${config.entityName} not found` } };
  }
  if (!item.deletedAt) {
    return { status: 400, body: { error: `${config.entityName} is not in trash` } };
  }

  const originalSlug = item.originalSlug || item.slug.replace(/^_deleted_\d+_/, '');
  const conflict = await config.findSlugConflict(originalSlug, item.id);
  const restoredSlug = conflict ? `${originalSlug}-restored-${Date.now()}` : originalSlug;

  await config.updateItem(id, {
    deletedAt: null,
    originalSlug: null,
    slug: restoredSlug,
  });

  if (config.onAfterRestore) {
    await config.onAfterRestore();
  }

  return {
    status: 200,
    body: {
      success: true,
      slug: restoredSlug,
      message: `${config.entityName} restored`,
      ...(restoredSlug !== originalSlug ? { newSlug: restoredSlug } : {}),
    },
  };
}

/**
 * Permanent delete: only allowed for items already in trash
 */
export async function permanentDeleteItem(config: TrashConfig, id: string) {
  const item = await config.findUnique(id);
  if (!item) {
    return { status: 404, body: { error: `${config.entityName} not found` } };
  }
  if (!item.deletedAt) {
    return {
      status: 400,
      body: {
        error: `${config.entityName} must be in trash before permanent deletion`,
      },
    };
  }

  if (config.onBeforePermanentDelete) {
    await config.onBeforePermanentDelete(id);
  }

  await config.deleteItem(id);

  return {
    status: 200,
    body: { success: true, message: `${config.entityName} permanently deleted` },
  };
}

/**
 * Empty trash: permanently delete all trashed items
 */
export async function emptyTrash(config: TrashConfig) {
  if (config.onBeforeEmptyTrash) {
    await config.onBeforeEmptyTrash();
  }

  const result = await config.deleteAllTrashed();

  return {
    status: 200,
    body: {
      success: true,
      deleted: result.count,
      message: `${result.count} ${config.entityName.toLowerCase()}(s) permanently deleted`,
    },
  };
}
