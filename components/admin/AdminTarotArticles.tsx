/**
 * Admin Tarot Articles - Container Component
 *
 * Slim container that manages tab navigation and modal state.
 * Individual tabs handle their own data fetching and state.
 */

import React, { useState, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { FileText, Folder, Tag, Image as ImageIcon, Trash, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TarotArticleEditor from './TarotArticleEditor';
import TarotCategoriesManager from './TarotCategoriesManager';
import TarotTagsManager from './TarotTagsManager';
import TarotMediaManager from './TarotMediaManager';
import ImportArticle from './ImportArticle';
import { ArticlesTab } from './tarot-articles/ArticlesTab';
import { TrashTab } from './tarot-articles/TrashTab';
import { TabType, ConfirmModal } from './tarot-articles/types';

const AdminTarotArticles: React.FC = () => {
  const { language } = useApp();

  // Tab and view state
  const [activeTab, setActiveTab] = useState<TabType>('articles');
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  // Counts for tab badges (updated by child components)
  const [articleCount, setArticleCount] = useState(0);
  const [trashCount, setTrashCount] = useState(0);

  // Global error state
  const [error, setError] = useState<string | null>(null);

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState<ConfirmModal>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Reload functions for cross-tab updates
  const [articlesReloadTrigger, setArticlesReloadTrigger] = useState(0);
  const [trashReloadTrigger, setTrashReloadTrigger] = useState(0);

  const reloadArticles = useCallback(() => {
    setArticlesReloadTrigger((prev) => prev + 1);
  }, []);

  const reloadTrash = useCallback(() => {
    setTrashReloadTrigger((prev) => prev + 1);
  }, []);

  // If editing an article, show the editor
  if (editingArticleId) {
    return (
      <TarotArticleEditor
        articleId={editingArticleId}
        onSave={() => {
          setEditingArticleId(null);
          reloadArticles();
        }}
        onCancel={() => setEditingArticleId(null)}
      />
    );
  }

  return (
    <div>
      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center justify-between">
          <p className="text-red-400">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setActiveTab('articles')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'articles'
              ? 'bg-purple-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          {language === 'en' ? 'Articles' : 'Articles'}
          {articleCount > 0 && (
            <span
              className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === 'articles' ? 'bg-purple-700' : 'bg-slate-700'
              }`}
            >
              {articleCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'categories'
              ? 'bg-purple-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Folder className="w-4 h-4" />
          {language === 'en' ? 'Categories' : 'Categories'}
        </button>
        <button
          onClick={() => setActiveTab('tags')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'tags'
              ? 'bg-purple-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Tag className="w-4 h-4" />
          Tags
        </button>
        <button
          onClick={() => setActiveTab('media')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'media'
              ? 'bg-purple-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          {language === 'en' ? 'Media' : 'Medias'}
        </button>
        <button
          onClick={() => setActiveTab('trash')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'trash'
              ? 'bg-purple-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Trash className="w-4 h-4" />
          {language === 'en' ? 'Trash' : 'Corbeille'}
          {trashCount > 0 && (
            <span
              className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === 'trash' ? 'bg-purple-700' : 'bg-slate-700'
              }`}
            >
              {trashCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'articles' && (
        <ArticlesTab
          key={articlesReloadTrigger}
          onEditArticle={setEditingArticleId}
          onImportClick={() => setShowImportModal(true)}
          onTrashUpdated={reloadTrash}
          setConfirmModal={setConfirmModal}
        />
      )}

      {activeTab === 'categories' && <TarotCategoriesManager />}

      {activeTab === 'tags' && <TarotTagsManager />}

      {activeTab === 'media' && <TarotMediaManager />}

      {activeTab === 'trash' && (
        <TrashTab
          key={trashReloadTrigger}
          onArticleRestored={reloadArticles}
          setConfirmModal={setConfirmModal}
        />
      )}

      {/* Import Modal */}
      <AnimatePresence>
        {showImportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4"
            onClick={() => setShowImportModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 rounded-xl border border-purple-500/30 p-0 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <ImportArticle
                isModal={true}
                onClose={() => setShowImportModal(false)}
                onSuccess={() => {
                  setShowImportModal(false);
                  reloadArticles();
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Modal */}
      <AnimatePresence>
        {confirmModal.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} })}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-800 rounded-xl border border-purple-500/20 p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-heading text-amber-400 mb-4">{confirmModal.title}</h3>
              <p className="text-slate-300 mb-6">{confirmModal.message}</p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() =>
                    setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} })
                  }
                  className="px-4 py-2 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600"
                >
                  {language === 'en' ? 'Cancel' : 'Annuler'}
                </button>
                <button
                  onClick={confirmModal.onConfirm}
                  className={`px-4 py-2 rounded-lg ${
                    confirmModal.isDangerous
                      ? 'bg-red-600 text-white hover:bg-red-500'
                      : 'bg-purple-600 text-white hover:bg-purple-500'
                  }`}
                >
                  {language === 'en' ? 'Confirm' : 'Confirmer'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminTarotArticles;
