/**
 * Trash management routes (soft delete, restore, permanent delete)
 */

import { prisma, cacheService } from './shared.js';
import { TrashConfig } from '../../services/content/TrashUtils.js';
import { createTrashRouter } from '../shared/trashRouterFactory.js';
import { taxonomyService } from '../../services/TaxonomyService.js';

const blogTrashConfig: TrashConfig = {
  entityName: 'Post',
  findUnique: id => prisma.blogPost.findFirst({ where: { id } }),
  updateItem: (id, data) => prisma.blogPost.update({ where: { id }, data }),
  deleteItem: id => prisma.blogPost.delete({ where: { id } }),
  findSlugConflict: (slug, excludeId) =>
    prisma.blogPost.findFirst({ where: { slug, id: { not: excludeId } } }),
  deleteAllTrashed: () =>
    prisma.blogPost.deleteMany({
      where: { deletedAt: { not: null } },
    }),
  onAfterSoftDelete: async () => {
    await cacheService.flushPattern('blog:');
    await taxonomyService.invalidateAll();
  },
  onAfterRestore: async () => {
    await cacheService.flushPattern('blog:');
    await taxonomyService.invalidateAll();
  },
};

export default createTrashRouter({ config: blogTrashConfig, itemPrefix: '/posts' });
