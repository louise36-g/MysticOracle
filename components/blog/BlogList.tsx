import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import {
  fetchBlogPosts,
  fetchBlogCategories,
  fetchBlogTags,
  BlogPost,
  BlogCategory,
  BlogTag,
} from '../../services/apiService';
import { Calendar, Clock, Eye, ChevronLeft, ChevronRight, Search, Tag, Folder, Star, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { SmartLink } from '../SmartLink';
import { useTranslation } from '../../context/TranslationContext';

interface BlogListProps {
  onNavigateToPost: (slug: string) => void;
  initialCategory?: string;
  initialTag?: string;
}

const BlogList: React.FC<BlogListProps> = ({ onNavigateToPost, initialCategory, initialTag }) => {
  const { language } = useApp();
  const { t } = useTranslation();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || '');
  const [selectedTag, setSelectedTag] = useState<string>(initialTag || '');
  const [featuredPosts, setFeaturedPosts] = useState<BlogPost[]>([]);

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchBlogPosts({
        page,
        limit: 9,
        category: selectedCategory || undefined,
        tag: selectedTag || undefined,
      });
      setPosts(result.posts);
      setTotalPages(result.pagination.totalPages);
      setTotal(result.pagination.total);
    } catch (err) {
      console.error('Failed to load posts:', err);
    } finally {
      setLoading(false);
    }
  }, [page, selectedCategory, selectedTag]);

  const loadCategories = useCallback(async () => {
    try {
      const result = await fetchBlogCategories();
      setCategories(result.categories);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  }, []);

  const loadTags = useCallback(async () => {
    try {
      const result = await fetchBlogTags();
      setTags(result.tags);
    } catch (err) {
      console.error('Failed to load tags:', err);
    }
  }, []);

  const loadFeatured = useCallback(async () => {
    try {
      const result = await fetchBlogPosts({ featured: true, limit: 3 });
      setFeaturedPosts(result.posts);
    } catch (err) {
      console.error('Failed to load featured posts:', err);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    loadCategories();
    loadTags();
    loadFeatured();
  }, [loadCategories, loadTags, loadFeatured]);

  const handleCategoryClick = (slug: string) => {
    setSelectedCategory(selectedCategory === slug ? '' : slug);
    setSelectedTag('');
    setPage(1);
  };

  const handleTagClick = (slug: string) => {
    setSelectedTag(selectedTag === slug ? '' : slug);
    setSelectedCategory('');
    setPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-b from-amber-100 to-purple-300 mb-4">
          {t('blog.BlogList.mystic_insights', 'Mystic Insights')}
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          {t('blog.BlogList.explore_mystical_world', 'Explore the mystical world of tarot, astrology, and spiritual growth through our curated articles.')}
        </p>
      </div>

      {/* Featured Posts */}
      {featuredPosts.length > 0 && !selectedCategory && !selectedTag && page === 1 && (
        <section className="mb-16">
          <h2 className="text-2xl font-heading text-purple-200 mb-6 flex items-center gap-2">
            <Star className="w-6 h-6 text-amber-400" />
            {t('blog.BlogList.featured_articles', 'Featured Articles')}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {featuredPosts.map((post, index) => (
              <SmartLink
                key={post.id}
                href={`/blog/${post.slug}`}
                onClick={() => onNavigateToPost(post.slug)}
                className="group cursor-pointer bg-gradient-to-br from-purple-900/40 to-slate-900/60 rounded-2xl overflow-hidden border border-amber-500/20 hover:border-amber-500/40 transition-all hover:shadow-xl hover:shadow-purple-500/10 block"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {post.coverImage && (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={post.coverImage}
                        alt={post.coverImageAlt || (language === 'en' ? post.titleEn : post.titleFr)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {post.categories.slice(0, 2).map((cat) => (
                        <span
                          key={cat.id}
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                        >
                          {language === 'en' ? cat.nameEn : cat.nameFr}
                        </span>
                      ))}
                    </div>
                    <h3 className="text-lg font-heading text-white group-hover:text-amber-300 transition-colors mb-2 line-clamp-2">
                      {language === 'en' ? post.titleEn : post.titleFr}
                    </h3>
                    <p className="text-slate-400 text-sm line-clamp-2 mb-4">
                      {language === 'en' ? post.excerptEn : post.excerptFr}
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {post.readTimeMinutes} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {post.viewCount}
                        </span>
                      </div>
                      <span className="text-amber-400 group-hover:translate-x-1 transition-transform">
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </motion.div>
              </SmartLink>
            ))}
          </div>
        </section>
      )}

      {/* Categories & Tags - Compact Filter Bar */}
      {(categories.length > 0 || tags.length > 0) && (
        <section className="mb-8 p-4 bg-slate-900/50 rounded-xl border border-purple-500/10">
          <div className="flex flex-wrap items-center gap-4">
            {categories.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-slate-500 flex items-center gap-1 text-sm">
                  <Folder className="w-3.5 h-3.5" />
                </span>
                {categories.slice(0, 5).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.slug)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                      selectedCategory === cat.slug
                        ? 'text-white shadow-md'
                        : 'text-slate-300 hover:text-white'
                    }`}
                    style={{
                      backgroundColor: selectedCategory === cat.slug ? cat.color : `${cat.color}15`,
                    }}
                  >
                    {language === 'en' ? cat.nameEn : cat.nameFr}
                  </button>
                ))}
              </div>
            )}
            {categories.length > 0 && tags.length > 0 && (
              <div className="h-4 w-px bg-slate-700" />
            )}
            {tags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-slate-500 flex items-center gap-1 text-sm">
                  <Tag className="w-3.5 h-3.5" />
                </span>
                {tags.slice(0, 6).map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleTagClick(tag.slug)}
                    className={`px-2.5 py-1 rounded-full text-xs transition-all ${
                      selectedTag === tag.slug
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {language === 'en' ? tag.nameEn : tag.nameFr}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Filter indicator */}
      {(selectedCategory || selectedTag) && (
        <div className="mb-6 flex items-center gap-2">
          <span className="text-slate-400">
            {t('blog.BlogList.filtering_by', 'Filtering by:')}
          </span>
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory('')}
              className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm flex items-center gap-1"
            >
              {categories.find((c) => c.slug === selectedCategory)?.[language === 'en' ? 'nameEn' : 'nameFr']}
              <span className="ml-1">&times;</span>
            </button>
          )}
          {selectedTag && (
            <button
              onClick={() => setSelectedTag('')}
              className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm flex items-center gap-1"
            >
              #{tags.find((t) => t.slug === selectedTag)?.[language === 'en' ? 'nameEn' : 'nameFr']}
              <span className="ml-1">&times;</span>
            </button>
          )}
        </div>
      )}

      {/* All Posts Grid */}
      <section>
        <h2 className="text-2xl font-heading text-purple-200 mb-6">
          {selectedCategory || selectedTag
            ? t('blog.BlogList.filtered_articles', 'Filtered Articles')
            : t('blog.BlogList.all_articles', 'All Articles')}
          <span className="text-slate-500 text-lg ml-2">({total})</span>
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <p>{t('blog.BlogList.no_articles_found', 'No articles found.')}</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post, index) => (
              <SmartLink
                key={post.id}
                href={`/blog/${post.slug}`}
                onClick={() => onNavigateToPost(post.slug)}
                className="group cursor-pointer bg-slate-900/60 rounded-xl overflow-hidden border border-purple-500/20 hover:border-purple-500/40 transition-all hover:shadow-lg hover:shadow-purple-500/10 block"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {post.coverImage && (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={post.coverImage}
                        alt={post.coverImageAlt || (language === 'en' ? post.titleEn : post.titleFr)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {post.categories.slice(0, 2).map((cat) => (
                        <span
                          key={cat.id}
                          className="px-2 py-0.5 rounded-full text-xs"
                          style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                        >
                          {language === 'en' ? cat.nameEn : cat.nameFr}
                        </span>
                      ))}
                    </div>
                    <h3 className="text-lg font-heading text-white group-hover:text-purple-300 transition-colors mb-2 line-clamp-2">
                      {language === 'en' ? post.titleEn : post.titleFr}
                    </h3>
                    <p className="text-slate-400 text-sm line-clamp-2 mb-4">
                      {language === 'en' ? post.excerptEn : post.excerptFr}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(post.publishedAt || post.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.readTimeMinutes} min
                      </span>
                    </div>
                  </div>
                </motion.div>
              </SmartLink>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-12">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-3 bg-slate-800 rounded-lg text-slate-300 disabled:opacity-50 hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-slate-300 px-4">
              {t('blog.BlogList.page_x_of_y', `Page ${page} of ${totalPages}`, { page, totalPages })}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-3 bg-slate-800 rounded-lg text-slate-300 disabled:opacity-50 hover:bg-slate-700 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default BlogList;
