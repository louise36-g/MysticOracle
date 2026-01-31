import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { CTAItem } from '../../../services/api';

interface BlogCTAProps {
  cta: CTAItem;
}

/**
 * BlogCTA Component
 *
 * Renders a call-to-action banner with heading, text, and button.
 */
export const BlogCTA: React.FC<BlogCTAProps> = ({ cta }) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.28 }}
      className="mb-12"
    >
      <div className="cta-banner p-12 rounded-3xl bg-[#2d1b4e] border border-purple-500/20 text-center">
        <h3 className="text-3xl md:text-4xl font-heading text-white mb-4">
          {cta.heading}
        </h3>
        <p className="text-slate-300 mb-8 max-w-2xl mx-auto text-lg">
          {cta.text}
        </p>
        <Link
          to={cta.buttonUrl}
          className="inline-flex items-center gap-2 px-8 py-4 bg-purple-600 text-white rounded-xl hover:bg-purple-500 transition-colors font-medium text-lg shadow-lg shadow-purple-500/20"
        >
          {cta.buttonText}
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </motion.section>
  );
};
