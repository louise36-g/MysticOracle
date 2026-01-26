/**
 * Articles Tab - Tarot article list with search, filters, and drag-drop reorder
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../../context/AppContext';
import { ROUTES, buildRoute } from '../../../routes/routes';
import { TarotArticle } from '../../../services/apiService';
import {
  Search,
  Edit2,
  Trash2,
  FileText,
  Upload,
  ChevronLeft,
  ChevronRight,
  Archive,
  CheckCircle,
  ImageOff,
  GripVertical,
  ExternalLink,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useArticleList } from './hooks/useArticleList';
import { CardType, ArticleStatus, CARD_TYPE_BADGES, formatDate, ConfirmModal } from './types';

interface ArticlesTabProps {
  onEditArticle: (id: string) => void;
  onImportClick: () => void;
  onTrashUpdated: () => void;
  setConfirmModal: (modal: ConfirmModal) => void;
  cardTypeFilter?: CardType | '';
  onCardTypeFilterChange?: (filter: CardType | '') => void;
}

interface SortableArticleRowProps {
  article: TarotArticle;
  getStatusBadge: (status: ArticleStatus) => React.ReactElement;
  onEdit: (id: string) => void;
  onDelete: (article: TarotArticle) => void;
  actionLoading: string | null;
  language: string;
  isDragEnabled: boolean;
}

const SortableArticleRow: React.FC<SortableArticleRowProps> = ({
  article,
  getStatusBadge,
  onEdit,
  onDelete,
  actionLoading,
  language,
  isDragEnabled,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: article.id,
    disabled: !isDragEnabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const cardTypeBadge = CARD_TYPE_BADGES[article.cardType as CardType];

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors ${
        isDragging ? 'z-50 shadow-2xl' : ''
      }`}
    >
      {/* Drag Handle */}
      <td className="px-4 py-3">
        {isDragEnabled ? (
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 transition-colors"
          >
            <GripVertical className="w-5 h-5" />
          </div>
        ) : (
          <div className="w-5 h-5" />
        )}
      </td>

      {/* Image */}
      <td className="px-4 py-3">
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-800 flex items-center justify-center">
          {article.featuredImage ? (
            <img
              src={article.featuredImage}
              alt={article.featuredImageAlt || article.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageOff className="w-6 h-6 text-slate-600" />
          )}
        </div>
      </td>

      {/* Title */}
      <td className="px-4 py-3">
        <Link
          to={buildRoute(ROUTES.ADMIN_TAROT_EDIT, { id: article.id })}
          className="font-medium text-white hover:text-purple-400 transition-colors block"
        >
          {article.title}
        </Link>
        <div className="text-sm text-slate-400 mt-1">{article.slug}</div>
      </td>

      {/* Card Number */}
      <td className="px-4 py-3">
        <span className="text-slate-300 font-mono">{article.cardNumber}</span>
      </td>

      {/* Card Type */}
      <td className="px-4 py-3">
        <span className={`px-2 py-1 rounded-full text-xs ${cardTypeBadge.bg} ${cardTypeBadge.text}`}>
          {cardTypeBadge.label}
        </span>
      </td>

      {/* Status */}
      <td className="px-4 py-3">{getStatusBadge(article.status)}</td>

      {/* Updated */}
      <td className="px-4 py-3 text-sm text-slate-400">{formatDate(article.updatedAt, language)}</td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <a
            href={`/tarot/${article.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
            title={language === 'en' ? 'View Article' : 'Voir l\'article'}
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          <button
            onClick={() => onEdit(article.id)}
            className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
            title={language === 'en' ? 'Edit' : 'Modifier'}
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(article)}
            disabled={actionLoading === article.id}
            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
            title={language === 'en' ? 'Delete' : 'Supprimer'}
          >
            {actionLoading === article.id ? (
              <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </td>
    </tr>
  );
};

export const ArticlesTab: React.FC<ArticlesTabProps> = ({
  onEditArticle,
  onImportClick,
  onTrashUpdated,
  setConfirmModal,
  cardTypeFilter: externalCardTypeFilter,
  onCardTypeFilterChange,
}) => {
  const { language } = useApp();
  const {
    articles,
    loading,
    error,
    pagination,
    searchQuery,
    statusFilter,
    cardTypeFilter,
    actionLoading,
    isReordering,
    canReorder,
    loadArticles,
    setSearchQuery,
    setStatusFilter,
    setCardTypeFilter: setInternalCardTypeFilter,
    setPage,
    clearError,
    deleteArticle,
    reorderArticles,
  } = useArticleList({ initialLimit: 100, initialCardTypeFilter: externalCardTypeFilter });

  // Wrapper to notify parent of filter changes
  const setCardTypeFilter = (filter: CardType | '') => {
    setInternalCardTypeFilter(filter);
    onCardTypeFilterChange?.(filter);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const getStatusBadge = (status: ArticleStatus) => {
    const badges = {
      DRAFT: {
        bg: 'bg-amber-500/20',
        text: 'text-amber-400',
        label: language === 'en' ? 'Draft' : 'Brouillon',
        Icon: FileText,
      },
      PUBLISHED: {
        bg: 'bg-green-500/20',
        text: 'text-green-400',
        label: language === 'en' ? 'Published' : 'Publie',
        Icon: CheckCircle,
      },
      ARCHIVED: {
        bg: 'bg-slate-500/20',
        text: 'text-slate-400',
        label: language === 'en' ? 'Archived' : 'Archive',
        Icon: Archive,
      },
    };
    const badge = badges[status];
    const Icon = badge.Icon;
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${badge.bg} ${badge.text}`}
      >
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  const handleDelete = (article: TarotArticle) => {
    setConfirmModal({
      show: true,
      title: language === 'en' ? 'Move to Trash?' : 'Deplacer vers la corbeille?',
      message:
        language === 'en'
          ? `Move "${article.title}" to trash? You can restore it later.`
          : `Deplacer "${article.title}" vers la corbeille? Vous pourrez le restaurer plus tard.`,
      isDangerous: true,
      onConfirm: async () => {
        await deleteArticle(article.id);
        onTrashUpdated();
        setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} });
      },
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || isReordering) {
      return;
    }

    const oldIndex = articles.findIndex((a) => a.id === active.id);
    const newIndex = articles.findIndex((a) => a.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const movedArticle = articles[oldIndex];
    const reorderedArticles = arrayMove(articles, oldIndex, newIndex);
    await reorderArticles(movedArticle.id, movedArticle.cardType, newIndex, reorderedArticles);
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

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 mb-2">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={
              language === 'en' ? 'Search by title or slug...' : 'Rechercher par titre ou slug...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <select
          value={cardTypeFilter}
          onChange={(e) => setCardTypeFilter(e.target.value as CardType | '')}
          className="px-4 py-2 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500"
        >
          <option value="">{language === 'en' ? 'All Types' : 'Tous les types'}</option>
          <option value="MAJOR_ARCANA">Major Arcana</option>
          <option value="SUIT_OF_WANDS">Wands</option>
          <option value="SUIT_OF_CUPS">Cups</option>
          <option value="SUIT_OF_SWORDS">Swords</option>
          <option value="SUIT_OF_PENTACLES">Pentacles</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ArticleStatus | '')}
          className="px-4 py-2 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500"
        >
          <option value="">{language === 'en' ? 'All Status' : 'Tous les statuts'}</option>
          <option value="DRAFT">{language === 'en' ? 'Draft' : 'Brouillon'}</option>
          <option value="PUBLISHED">{language === 'en' ? 'Published' : 'Publie'}</option>
          <option value="ARCHIVED">{language === 'en' ? 'Archived' : 'Archive'}</option>
        </select>

        <button
          onClick={onImportClick}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500"
        >
          <Upload className="w-4 h-4" />
          {language === 'en' ? 'Import JSON' : 'Importer JSON'}
        </button>
      </div>

      {/* Drag-and-drop helper text */}
      <p className="mb-4 text-xs text-slate-500">
        {language === 'en'
          ? 'To reorder cards, select a card type, clear the search field, and remove any status filter. Then drag rows using the handle on the left.'
          : 'Pour réorganiser les cartes, sélectionnez un type de carte, videz le champ de recherche et retirez tout filtre de statut. Ensuite, faites glisser les lignes à l’aide de la poignée à gauche.'}
      </p>

      {/* Articles Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : articles.length === 0 ? (
        <div className="bg-slate-900/60 rounded-xl border border-purple-500/20 p-8 text-center text-slate-400">
          {language === 'en'
            ? 'No articles yet. Import your first article!'
            : 'Aucun article. Importez votre premier article!'}
        </div>
      ) : (
        <>
          {/* Loading indicator during reorder */}
          {isReordering && (
            <div className="mb-4 px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-blue-400 text-sm">
                {language === 'en' ? 'Saving new order...' : 'Enregistrement du nouvel ordre...'}
              </span>
            </div>
          )}

          <div className="bg-slate-900/60 rounded-xl border border-purple-500/20 overflow-hidden">
            <div className="overflow-x-auto">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={articles.map((a) => a.id)} strategy={verticalListSortingStrategy}>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-12" />
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                          {language === 'en' ? 'Image' : 'Image'}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                          {language === 'en' ? 'Title' : 'Titre'}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                          {language === 'en' ? 'Card #' : 'Carte #'}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                          {language === 'en' ? 'Type' : 'Type'}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                          {language === 'en' ? 'Status' : 'Statut'}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                          {language === 'en' ? 'Updated' : 'Modifie'}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                          {language === 'en' ? 'Actions' : 'Actions'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {articles.map((article) => (
                        <SortableArticleRow
                          key={article.id}
                          article={article}
                          getStatusBadge={getStatusBadge}
                          onEdit={onEditArticle}
                          onDelete={handleDelete}
                          actionLoading={actionLoading}
                          language={language}
                          isDragEnabled={canReorder}
                        />
                      ))}
                    </tbody>
                  </table>
                </SortableContext>
              </DndContext>
            </div>
          </div>
        </>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-slate-400 text-sm">
            {language === 'en'
              ? `Showing ${articles.length} of ${pagination.total} articles`
              : `Affichage de ${articles.length} sur ${pagination.total} articles`}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, pagination.page - 1))}
              disabled={pagination.page === 1}
              className="p-2 bg-slate-800 rounded-lg text-slate-300 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-slate-300 px-4">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(pagination.totalPages, pagination.page + 1))}
              disabled={pagination.page >= pagination.totalPages}
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

export default ArticlesTab;
