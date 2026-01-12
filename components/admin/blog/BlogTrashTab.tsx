import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../../../context/AppContext';
import {
  fetchAdminBlogPosts,
  restoreBlogPost,
  permanentlyDeleteBlogPost,
  emptyBlogTrash,
} from '../../../services/apiService';
import { Trash2, Trash, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import type { BlogPost, Pagination } from './types';

interface BlogTrashTabProps {
  onLoadPosts: () => Promise<void>;
  onShowConfirmModal: (config: {
    title: string;
    message: string;
    onConfirm: () => void;
    isDangerous?: boolean;
  }) => void;
  onError: (error: string | null) => void;
  onTrashCountChange: (count: number) => void;
}

const BlogTrashTab: React.FC<BlogTrashTabProps> = ({
  onLoadPosts,
  onShowConfirmModal,
  onError,
  onTrashCountChange,
}) => {
  const { language } = useApp();
  const { getToken } = useAuth();

  const [trashPosts, setTrashPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const loadTrash = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;

      const result = await fetchAdminBlogPosts(token, {
        page: pagination.page,
        limit: pagination.limit,
        deleted: true,
      });

      setTrashPosts(result.posts);
      setPagination(result.pagination);
      onTrashCountChange(result.pagination.total);
    } catch (err) {
      console.error('Failed to load trash:', err);
    } finally {
      setLoading(false);
    }
  }, [getToken, pagination.page, pagination.limit, onTrashCountChange]);

  useEffect(() => {
    loadTrash();
  }, [loadTrash]);

  const handleRestorePost = async (id: string) => {
    try {
      const token = await getToken();
      if (!token) return;

      await restoreBlogPost(token, id);
      loadTrash();
      onLoadPosts();
    } catch {
      onError(language === 'en' ? 'Failed to restore post' : 'Échec de la restauration');
    }
  };

  const handlePermanentDelete = (id: string) => {
    onShowConfirmModal({
      title: language === 'en' ? 'Permanently Delete' : 'Supprimer définitivement',
      message:
        language === 'en'
          ? 'This will permanently delete this post. This action cannot be undone.'
          : 'Cela supprimera définitivement cet article. Cette action est irréversible.',
      isDangerous: true,
      onConfirm: async () => {
        try {
          const token = await getToken();
          if (!token) return;
          await permanentlyDeleteBlogPost(token, id);
          loadTrash();
        } catch {
          onError(language === 'en' ? 'Failed to delete post' : 'Échec de la suppression');
        }
      },
    });
  };

  const handleEmptyTrash = () => {
    onShowConfirmModal({
      title: language === 'en' ? 'Empty Trash' : 'Vider la corbeille',
      message:
        language === 'en'
          ? `Permanently delete all ${trashPosts.length} items in trash? This cannot be undone.`
          : `Supprimer définitivement les ${trashPosts.length} éléments de la corbeille? Cette action est irréversible.`,
      isDangerous: true,
      onConfirm: async () => {
        try {
          const token = await getToken();
          if (!token) return;
          await emptyBlogTrash(token);
          loadTrash();
        } catch {
          onError(
            language === 'en' ? 'Failed to empty trash' : 'Échec du vidage de la corbeille'
          );
        }
      },
    });
  };

  return (
    <div>
      {trashPosts.length > 0 && (
        <div className="flex justify-end mb-4">
          <button
            onClick={handleEmptyTrash}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500"
          >
            <Trash2 className="w-4 h-4" />
            {language === 'en' ? 'Empty Trash' : 'Vider la corbeille'}
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : trashPosts.length === 0 ? (
        <div className="text-center py-20">
          <Trash className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl text-slate-400 mb-2">
            {language === 'en' ? 'Trash is empty' : 'La corbeille est vide'}
          </h3>
          <p className="text-slate-500">
            {language === 'en'
              ? 'Deleted posts will appear here'
              : 'Les articles supprimés apparaîtront ici'}
          </p>
        </div>
      ) : (
        <div className="bg-slate-900/60 rounded-xl border border-purple-500/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-purple-500/20 bg-slate-800/50">
                  <th className="text-left p-4 text-slate-300 font-medium">
                    {language === 'en' ? 'Title' : 'Titre'}
                  </th>
                  <th className="text-left p-4 text-slate-300 font-medium">
                    {language === 'en' ? 'Original Slug' : 'Slug original'}
                  </th>
                  <th className="text-left p-4 text-slate-300 font-medium">
                    {language === 'en' ? 'Deleted' : 'Supprimé'}
                  </th>
                  <th className="text-left p-4 text-slate-300 font-medium">
                    {language === 'en' ? 'Actions' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {trashPosts.map(post => (
                  <tr key={post.id} className="border-b border-purple-500/10 hover:bg-slate-800/30">
                    <td className="p-4">
                      <p className="text-slate-200 font-medium">
                        {language === 'en' ? post.titleEn : post.titleFr}
                      </p>
                    </td>
                    <td className="p-4 text-slate-400 text-sm">
                      {post.originalSlug || post.slug.replace(/^_deleted_\d+_/, '')}
                    </td>
                    <td className="p-4 text-slate-400 text-sm">
                      {post.deletedAt ? new Date(post.deletedAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRestorePost(post.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 text-sm"
                          title={language === 'en' ? 'Restore' : 'Restaurer'}
                        >
                          <RotateCcw className="w-4 h-4" />
                          {language === 'en' ? 'Restore' : 'Restaurer'}
                        </button>
                        <button
                          onClick={() => handlePermanentDelete(post.id)}
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"
                          title={
                            language === 'en' ? 'Delete permanently' : 'Supprimer définitivement'
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Trash Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-slate-400 text-sm">
            {language === 'en'
              ? `Showing ${trashPosts.length} of ${pagination.total} items`
              : `Affichage de ${trashPosts.length} sur ${pagination.total} éléments`}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
              disabled={pagination.page === 1}
              className="p-2 bg-slate-800 rounded-lg text-slate-300 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-slate-300 px-4">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() =>
                setPagination(p => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))
              }
              disabled={pagination.page >= pagination.totalPages}
              className="p-2 bg-slate-800 rounded-lg text-slate-300 disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogTrashTab;
