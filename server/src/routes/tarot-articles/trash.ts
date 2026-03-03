/**
 * Tarot Article Trash Routes
 *
 * Soft delete, restore, and permanent delete operations.
 * Requires authentication and admin privileges.
 *
 * Now operates on BlogPost table with contentType = 'TAROT_ARTICLE'.
 */

import { prisma, cacheService } from './shared.js';
import { TrashConfig } from '../../services/content/TrashUtils.js';
import { createTrashRouter } from '../shared/trashRouterFactory.js';

const tarotTrashConfig: TrashConfig = {
  entityName: 'Article',
  findUnique: id => prisma.blogPost.findFirst({ where: { id, contentType: 'TAROT_ARTICLE' } }),
  updateItem: (id, data) => prisma.blogPost.update({ where: { id }, data }),
  deleteItem: id => prisma.blogPost.delete({ where: { id } }),
  findSlugConflict: (slug, excludeId) =>
    prisma.blogPost.findFirst({ where: { slug, id: { not: excludeId } } }),
  deleteAllTrashed: () =>
    prisma.blogPost.deleteMany({
      where: { contentType: 'TAROT_ARTICLE', deletedAt: { not: null } },
    }),
  onAfterSoftDelete: async item => {
    await cacheService.invalidateTarotArticle(item.slug);
  },
  onAfterRestore: async () => {
    await cacheService.invalidateTarot();
  },
};

export default createTrashRouter({ config: tarotTrashConfig });
