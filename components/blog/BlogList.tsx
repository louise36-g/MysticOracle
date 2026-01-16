import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import {
  fetchBlogPosts,
  fetchBlogCategories,
  fetchTarotArticles,
  BlogPost,
  BlogCategory,
} from '../../services/apiService';
import { Calendar, Clock, Eye, ChevronLeft, ChevronRight, Folder, Star, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { SmartLink } from '../SmartLink';
import { useTranslation } from '../../context/TranslationContext';

// Unified article type for display
interface DisplayArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage?: string;
  coverImageAlt?: string;
  categories: { id: string; nameEn: string; nameFr: string; color?: string }[];
  readTimeMinutes: number;
  publishedAt: string;
  viewCount?: number;
  createdAt: string;
  type: 'blog' | 'tarot'; // Distinguish between blog posts and tarot articles
}

interface BlogListProps {
  onNavigateToPost: (slug: string) => void;
  initialCategory?: string;
}

const BlogList: React.FC<BlogListProps> = ({ onNavigateToPost, initialCategory }) => {
  const { language } = useApp();
  const { t } = useTranslation();
  const [articles, setArticles] = useState<DisplayArticle[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || '');
  const [featuredPosts, setFeaturedPosts] = useState<BlogPost[]>([]);

  // Convert blog post to display article
  const blogPostToArticle = (post: BlogPost): DisplayArticle => ({
    id: post.id,
    slug: post.slug,
    title: language === 'en' ? post.titleEn : post.titleFr,
    excerpt: language === 'en' ? post.excerptEn : post.excerptFr,
    coverImage: post.coverImage,
    coverImageAlt: post.coverImageAlt,
    categories: post.categories,
    readTimeMinutes: post.readTimeMinutes,
    publishedAt: post.publishedAt || post.createdAt,
    viewCount: post.viewCount,
    createdAt: post.createdAt,
    type: 'blog',
  });

  // Convert tarot article to display article
  const tarotArticleToArticle = (tarotArticle: any): DisplayArticle => {
    // Parse readTime string (e.g., "15 min read" -> 15)
    const readTimeMatch = tarotArticle.readTime?.match(/(\d+)/);
    const readTimeMinutes = readTimeMatch ? parseInt(readTimeMatch[1], 10) : 5;

    return {
      id: tarotArticle.id,
      slug: tarotArticle.slug,
      title: tarotArticle.title,
      excerpt: tarotArticle.excerpt,
      coverImage: tarotArticle.featuredImage,
      coverImageAlt: tarotArticle.featuredImageAlt,
      categories: [], // Tarot articles don't have explicit categories, we'll handle this in rendering
      readTimeMinutes,
      publishedAt: tarotArticle.datePublished || tarotArticle.createdAt,
      viewCount: 0,
      createdAt: tarotArticle.datePublished || tarotArticle.createdAt,
      type: 'tarot',
    };
  };

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);

      let allArticles: DisplayArticle[] = [];
      let combinedTotal = 0;
      let combinedTotalPages = 1;

      // Fetch blog posts
      const blogResult = await fetchBlogPosts({
        page,
        limit: 9,
        category: selectedCategory || undefined,
      });

      allArticles = blogResult.posts.map(blogPostToArticle);
      combinedTotal = blogResult.pagination.total;
      combinedTotalPages = blogResult.pagination.totalPages;

      // If Major Arcana or Tarot Meanings category is selected, also fetch tarot articles
      if (selectedCategory === 'major-arcana' || selectedCategory === 'tarot-meanings') {
        try {
          const tarotParams: any = {
            page,
            limit: 9,
            status: 'PUBLISHED',
          };

          // For Major Arcana, filter by card type
          if (selectedCategory === 'major-arcana') {
            tarotParams.cardType = 'MAJOR_ARCANA';
          }
          // For Tarot Meanings, fetch all types

          const tarotResult = await fetchTarotArticles(tarotParams);
          const tarotArticles = tarotResult.articles.map(tarotArticleToArticle);

          // Merge tarot articles with blog posts
          allArticles = [...tarotArticles, ...allArticles];
          combinedTotal += tarotResult.total;

          // Recalculate total pages based on combined total
          combinedTotalPages = Math.ceil(combinedTotal / 9);
        } catch (tarotErr) {
          console.error('Failed to load tarot articles:', tarotErr);
          // Continue with just blog posts if tarot fetch fails
        }
      }

      setArticles(allArticles);
      setTotalPages(combinedTotalPages);
      setTotal(combinedTotal);
    } catch (err) {
      console.error('Failed to load posts:', err);
    } finally {
      setLoading(false);
    }
  }, [page, selectedCategory, language]);

  const loadCategories = useCallback(async () => {
    try {
      const result = await fetchBlogCategories();
      setCategories(result.categories);
    } catch (err) {
      console.error('Failed to load categories:', err);
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
    loadFeatured();
  }, [loadCategories, loadFeatured]);

  const handleCategoryClick = (slug: string) => {
    setSelectedCategory(selectedCategory === slug ? '' : slug);
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

      {/* Category Filter Dropdown */}
      {(() => {
        // Only show categories with published articles
        const filteredCategories = categories.filter((cat) => cat.postCount > 0);

        return filteredCategories.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Folder className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-heading text-purple-200">
                {t('blog.BlogList.browse_by_category', 'Browse by Category')}
              </h2>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="w-full md:w-64 px-4 py-3 rounded-lg bg-slate-800/60 border border-purple-500/20 text-slate-300 hover:bg-slate-700 hover:border-purple-500/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all cursor-pointer"
            >
              <option value="">
                {t('blog.BlogList.all_categories', 'All Categories')} ({total})
              </option>
              {filteredCategories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {language === 'en' ? cat.nameEn : cat.nameFr} ({cat.postCount})
                </option>
              ))}
            </select>
          </section>
        );
      })()}

      {/* Featured Posts */}
      {featuredPosts.length > 0 && !selectedCategory && page === 1 && (
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


      {/* Filter indicator */}
      {selectedCategory && (
        <div className="mb-6 flex items-center gap-2">
          <span className="text-slate-400">
            {t('blog.BlogList.filtering_by', 'Filtering by:')}
          </span>
          <button
            onClick={() => setSelectedCategory('')}
            className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm flex items-center gap-1"
          >
            {categories.find((c) => c.slug === selectedCategory)?.[language === 'en' ? 'nameEn' : 'nameFr']}
            <span className="ml-1">&times;</span>
          </button>
        </div>
      )}

      {/* All Posts Grid */}
      <section>
        <h2 className="text-2xl font-heading text-purple-200 mb-6">
          {selectedCategory
            ? t('blog.BlogList.filtered_articles', 'Filtered Articles')
            : t('blog.BlogList.all_articles', 'All Articles')}
          <span className="text-slate-500 text-lg ml-2">({total})</span>
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <p>{t('blog.BlogList.no_articles_found', 'No articles found.')}</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article, index) => {
              // Determine navigation path based on article type
              const href = article.type === 'tarot' ? `/tarot/${article.slug}` : `/blog/${article.slug}`;
              const handleClick = article.type === 'tarot'
                ? () => window.location.href = href
                : () => onNavigateToPost(article.slug);

              return (
                <SmartLink
                  key={article.id}
                  href={href}
                  onClick={handleClick}
                  className="group cursor-pointer bg-slate-900/60 rounded-xl overflow-hidden border border-purple-500/20 hover:border-purple-500/40 transition-all hover:shadow-lg hover:shadow-purple-500/10 block"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    {article.coverImage && (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={article.coverImage}
                          alt={article.coverImageAlt || article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}
                    <div className="p-5">
                      <div className="flex flex-wrap gap-2 mb-3">
                        {article.type === 'tarot' ? (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-purple-500/20 text-purple-400">
                            Tarot Card
                          </span>
                        ) : (
                          article.categories.slice(0, 2).map((cat) => (
                            <span
                              key={cat.id}
                              className="px-2 py-0.5 rounded-full text-xs"
                              style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                            >
                              {language === 'en' ? cat.nameEn : cat.nameFr}
                            </span>
                          ))
                        )}
                      </div>
                      <h3 className="text-lg font-heading text-white group-hover:text-purple-300 transition-colors mb-2 line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-slate-400 text-sm line-clamp-2 mb-4">
                        {article.excerpt}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(article.publishedAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {article.readTimeMinutes} min
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </SmartLink>
              );
            })}
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
