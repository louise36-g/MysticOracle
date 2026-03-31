import React, { useState, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';
import {
  fetchUnifiedCategories,
  fetchUnifiedTags,
  fetchAdminBlogMedia,
  fetchAdminBlogPosts,
} from '../../services/api';
import { FileText, Folder, Tag, Image, Trash, AlertCircle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BlogPostsTab,
  BlogTaxonomyTab,
  BlogMediaTab,
  BlogTrashTab,
  BlogImportModal,
} from './blog';
import ImportArticle from './ImportArticle';
import type { TabType, ConfirmModalState } from './blog/types';

const AdminBlog: React.FC = () => {
  const { language } = useApp();
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('posts');

  // Stable ref for getToken — Clerk's getToken changes reference on auth
  // state updates, which would recreate every callback and cause BlogPostsTab
  // to re-render constantly (flickering titles, unresponsive edit buttons).
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  // Shared state
  const [error, setError] = useState<string | null>(null);
  const [trashCount, setTrashCount] = useState(0);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showTarotImportModal, setShowTarotImportModal] = useState(false);
  const [postsRefreshKey, setPostsRefreshKey] = useState(0);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Reload functions for cross-tab updates (use getTokenRef to keep stable)
  const loadCategories = useCallback(async () => {
    const token = await getTokenRef.current();
    if (token) await fetchUnifiedCategories(token);
  }, []);

  const loadTags = useCallback(async () => {
    const token = await getTokenRef.current();
    if (token) await fetchUnifiedTags(token);
  }, []);

  const loadMedia = useCallback(async () => {
    const token = await getTokenRef.current();
    if (token) await fetchAdminBlogMedia(token);
  }, []);

  const loadPosts = useCallback(async () => {
    // This triggers a refresh of BlogPostsTab
    // The component manages its own state
  }, []);

  const loadTrash = useCallback(async () => {
    const token = await getTokenRef.current();
    if (token) {
      const result = await fetchAdminBlogPosts(token, { deleted: true });
      setTrashCount(result.pagination.total);
    }
  }, []);

  // Stable getToken wrapper — never changes reference, always calls latest Clerk getToken
  const stableGetToken = useCallback(async () => getTokenRef.current(), []);

  const handleShowImportModal = useCallback(() => setShowImportModal(true), []);
  const handleShowTarotImportModal = useCallback(() => setShowTarotImportModal(true), []);

  const showConfirmModal = useCallback(
    (config: Omit<ConfirmModalState, 'show'>) => {
      setConfirmModal({ ...config, show: true });
    },
    []
  );

  const hideConfirmModal = useCallback(() => {
    setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} });
  }, []);

  const tabs = [
    { id: 'posts' as TabType, label: language === 'en' ? 'Posts' : 'Articles', icon: FileText },
    {
      id: 'categories' as TabType,
      label: language === 'en' ? 'Categories' : 'Categories',
      icon: Folder,
    },
    { id: 'tags' as TabType, label: language === 'en' ? 'Tags' : 'Tags', icon: Tag },
    { id: 'media' as TabType, label: language === 'en' ? 'Media' : 'Medias', icon: Image },
    {
      id: 'trash' as TabType,
      label: language === 'en' ? 'Trash' : 'Corbeille',
      icon: Trash,
      count: trashCount,
    },
  ];

  return (
    <div>
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {'count' in tab && tab.count > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-red-300 mb-4">
          {error}
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'posts' && (
        <BlogPostsTab
          key={postsRefreshKey}
          language={language}
          getToken={stableGetToken}
          onLoadCategories={loadCategories}
          onLoadTags={loadTags}
          onLoadTrash={loadTrash}
          onShowImportModal={handleShowImportModal}
          onShowTarotImportModal={handleShowTarotImportModal}
          onShowConfirmModal={showConfirmModal}
          onError={setError}
        />
      )}

      {activeTab === 'categories' && (
        <BlogTaxonomyTab type="categories" onShowConfirmModal={showConfirmModal} onError={setError} />
      )}

      {activeTab === 'tags' && (
        <BlogTaxonomyTab type="tags" onShowConfirmModal={showConfirmModal} onError={setError} />
      )}

      {activeTab === 'media' && (
        <BlogMediaTab onShowConfirmModal={showConfirmModal} onError={setError} />
      )}

      {activeTab === 'trash' && (
        <BlogTrashTab
          onLoadPosts={loadPosts}
          onShowConfirmModal={showConfirmModal}
          onError={setError}
          onTrashCountChange={setTrashCount}
        />
      )}

      {/* Import Modal */}
      <BlogImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => {
          // Increment refresh key to trigger posts reload
          setPostsRefreshKey(prev => prev + 1);
          loadTrash(); // Also refresh trash count
        }}
        onError={setError}
      />

      {/* Tarot Import Modal */}
      <AnimatePresence>
        {showTarotImportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4"
            onClick={() => setShowTarotImportModal(false)}
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
                onClose={() => setShowTarotImportModal(false)}
                onSuccess={() => {
                  setShowTarotImportModal(false);
                  setPostsRefreshKey(prev => prev + 1);
                  loadTrash();
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.show && (
          <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={e => {
              if (e.target === e.currentTarget) hideConfirmModal();
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-purple-500/30 rounded-xl p-6 max-w-md w-full"
            >
              <div className="flex items-center gap-3 mb-4">
                {confirmModal.isDangerous ? (
                  <div className="p-2 bg-red-500/20 rounded-full">
                    <AlertCircle className="w-6 h-6 text-red-400" />
                  </div>
                ) : (
                  <div className="p-2 bg-amber-500/20 rounded-full">
                    <Trash2 className="w-6 h-6 text-amber-400" />
                  </div>
                )}
                <h3 className="text-lg font-heading text-purple-200">{confirmModal.title}</h3>
              </div>
              <p className="text-slate-400 mb-6">{confirmModal.message}</p>
              <div className="flex gap-3">
                <button
                  onClick={hideConfirmModal}
                  className="flex-1 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600"
                >
                  {language === 'en' ? 'Cancel' : 'Annuler'}
                </button>
                <button
                  onClick={() => {
                    confirmModal.onConfirm();
                    hideConfirmModal();
                  }}
                  className={`flex-1 py-2 text-white rounded-lg ${
                    confirmModal.isDangerous
                      ? 'bg-red-600 hover:bg-red-500'
                      : 'bg-purple-600 hover:bg-purple-500'
                  }`}
                >
                  {language === 'en' ? 'Confirm' : 'Confirmer'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminBlog;
