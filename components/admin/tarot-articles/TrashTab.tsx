/**
 * Trash Tab - Deleted tarot articles with restore and permanent delete
 */

import React from 'react';
import { useApp } from '../../../context/AppContext';
import { Trash, Trash2, RotateCcw, ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import { useTrashList } from './hooks/useTrashList';
import { formatDate, ConfirmModal } from './types';

interface TrashTabProps {
  onArticleRestored: () => void;
  setConfirmModal: (modal: ConfirmModal) => void;
}

export const TrashTab: React.FC<TrashTabProps> = ({ onArticleRestored, setConfirmModal }) => {
  const { language } = useApp();
  const {
    articles: trashArticles,
    loading: trashLoading,
    error,
    pagination: trashPagination,
    actionLoading,
    setPage,
    clearError,
    restoreArticle,
    permanentDelete,
    emptyTrash,
  } = useTrashList();

  const handleRestore = async (articleId: string) => {
    const success = await restoreArticle(articleId);
    if (success) {
      onArticleRestored();
    }
  };

  const handlePermanentDelete = (articleId: string) => {
    setConfirmModal({
      show: true,
      title: language === 'en' ? 'Permanently Delete?' : 'Supprimer definitivement?',
      message:
        language === 'en'
          ? 'Permanently delete this article? This action cannot be undone.'
          : 'Supprimer definitivement cet article? Cette action est irreversible.',
      isDangerous: true,
      onConfirm: async () => {
        await permanentDelete(articleId);
        setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} });
      },
    });
  };

  const handleEmptyTrash = () => {
    setConfirmModal({
      show: true,
      title: language === 'en' ? 'Empty Trash?' : 'Vider la corbeille?',
      message:
        language === 'en'
          ? `Permanently delete all ${trashArticles.length} items in trash? This action cannot be undone.`
          : `Supprimer definitivement les ${trashArticles.length} elements de la corbeille? Cette action est irreversible.`,
      isDangerous: true,
      onConfirm: async () => {
        await emptyTrash();
        setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} });
      },
    });
  };

  return (
    <>
      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center justify-between">
          <p className="text-red-400">{error}</p>
          <button onClick={clearError} className="text-red-400 hover:text-red-300">
            &times;
          </button>
        </div>
      )}

      {trashArticles.length > 0 && (
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

      {trashLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : trashArticles.length === 0 ? (
        <div className="text-center py-20">
          <Trash className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl text-slate-400 mb-2">
            {language === 'en' ? 'Trash is empty' : 'La corbeille est vide'}
          </h3>
          <p className="text-slate-500">
            {language === 'en'
              ? 'Deleted articles will appear here'
              : 'Les articles supprimes apparaitront ici'}
          </p>
        </div>
      ) : (
        <div className="bg-slate-900/60 rounded-xl border border-purple-500/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-purple-500/20 bg-slate-800/50">
                  <th className="text-left p-4 text-slate-300 font-medium">
                    {language === 'en' ? 'Article' : 'Article'}
                  </th>
                  <th className="text-left p-4 text-slate-300 font-medium">
                    {language === 'en' ? 'Original Slug' : 'Slug original'}
                  </th>
                  <th className="text-left p-4 text-slate-300 font-medium">
                    {language === 'en' ? 'Deleted' : 'Supprime'}
                  </th>
                  <th className="text-left p-4 text-slate-300 font-medium">
                    {language === 'en' ? 'Actions' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {trashArticles.map((article) => (
                  <tr
                    key={article.id}
                    className="border-b border-purple-500/10 hover:bg-slate-800/30"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-16 h-16 flex-shrink-0">
                          {article.featuredImage ? (
                            <img
                              src={article.featuredImage}
                              alt={article.featuredImageAlt || article.title}
                              className="w-full h-full object-cover rounded-lg bg-slate-800"
                            />
                          ) : (
                            <div className="w-full h-full rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                              <ImageOff className="w-5 h-5 text-purple-400/50" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-slate-200 font-medium">{article.title}</p>
                          <p className="text-slate-500 text-sm">{article.cardNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-400 text-sm">
                      {article.originalSlug || article.slug.replace(/^_deleted_\d+_/, '')}
                    </td>
                    <td className="p-4 text-slate-400 text-sm">
                      {article.deletedAt
                        ? formatDate(article.deletedAt as unknown as string, language)
                        : '-'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRestore(article.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 text-sm"
                          title={language === 'en' ? 'Restore' : 'Restaurer'}
                          disabled={actionLoading === article.id}
                        >
                          <RotateCcw className="w-4 h-4" />
                          {language === 'en' ? 'Restore' : 'Restaurer'}
                        </button>
                        <button
                          onClick={() => handlePermanentDelete(article.id)}
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"
                          title={
                            language === 'en' ? 'Delete permanently' : 'Supprimer definitivement'
                          }
                          disabled={actionLoading === article.id}
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
      {trashPagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-slate-400 text-sm">
            {language === 'en'
              ? `Showing ${trashArticles.length} of ${trashPagination.total} articles`
              : `Affichage de ${trashArticles.length} sur ${trashPagination.total} articles`}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, trashPagination.page - 1))}
              disabled={trashPagination.page === 1}
              className="p-2 bg-slate-800 rounded-lg text-slate-300 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-slate-300 px-4">
              {trashPagination.page} / {trashPagination.totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(trashPagination.totalPages, trashPagination.page + 1))}
              disabled={trashPagination.page >= trashPagination.totalPages}
              className="p-2 bg-slate-800 rounded-lg text-slate-300 disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default TrashTab;
