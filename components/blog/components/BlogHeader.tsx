import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, Eye, User, Share2, Twitter, Facebook, Linkedin, Link2, Check } from 'lucide-react';
import { BlogPost as BlogPostType } from '../../../services/apiService';
import { ROUTES } from '../../../routes/routes';

interface BlogHeaderProps {
  post: BlogPostType;
  title: string;
  language: 'en' | 'fr';
  copied: boolean;
  formatDate: (dateString: string) => string;
  handleShare: (platform: string) => void;
  t: (key: string, fallback: string) => string;
}

export const BlogHeader: React.FC<BlogHeaderProps> = ({
  post,
  title,
  language,
  copied,
  formatDate,
  handleShare,
  t,
}) => {
  return (
    <motion.header
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 text-center"
    >
      {/* Categories */}
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        {post.categories.map((cat) => (
          <Link
            key={cat.id}
            to={`${ROUTES.BLOG}?category=${cat.slug}`}
            className="px-3 py-1 rounded-full text-sm font-medium hover:opacity-80 transition-opacity"
            style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
          >
            {language === 'en' ? cat.nameEn : cat.nameFr}
          </Link>
        ))}
      </div>

      {/* Title */}
      <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-purple-200 mb-6 leading-tight">
        {title}
      </h1>

      {/* Meta */}
      <div className="flex flex-wrap justify-center items-center gap-4 text-slate-400 text-sm mb-6">
        <span className="flex items-center gap-1">
          <User className="w-4 h-4" />
          {post.authorName}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          {formatDate(post.publishedAt || post.createdAt)}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          {post.readTimeMinutes} min {t('blog.BlogPost.read', 'read')}
        </span>
        <span className="flex items-center gap-1">
          <Eye className="w-4 h-4" />
          {post.viewCount.toLocaleString()} {t('blog.BlogPost.views', 'views')}
        </span>
      </div>

      {/* Share */}
      <div className="flex justify-center items-center gap-3">
        <span className="text-slate-500 flex items-center gap-1">
          <Share2 className="w-4 h-4" />
          {t('blog.BlogPost.share', 'Share:')}
        </span>
        <button
          onClick={() => handleShare('twitter')}
          className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-[#1DA1F2] hover:bg-[#1DA1F2]/10 transition-colors"
          aria-label="Share on Twitter"
        >
          <Twitter className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleShare('facebook')}
          className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-[#4267B2] hover:bg-[#4267B2]/10 transition-colors"
          aria-label="Share on Facebook"
        >
          <Facebook className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleShare('linkedin')}
          className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-[#0077B5] hover:bg-[#0077B5]/10 transition-colors"
          aria-label="Share on LinkedIn"
        >
          <Linkedin className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleShare('copy')}
          className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 transition-colors"
          aria-label="Copy link"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Link2 className="w-4 h-4" />}
        </button>
      </div>
    </motion.header>
  );
};
