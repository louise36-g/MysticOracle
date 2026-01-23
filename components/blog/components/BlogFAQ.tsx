import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export interface FAQItem {
  question: string;
  answer: string;
}

interface BlogFAQProps {
  faqItems: FAQItem[];
  openFAQIndex: number | null;
  onToggle: (index: number) => void;
  t: (key: string, fallback: string) => string;
}

/**
 * BlogFAQ Component
 *
 * Renders an accordion-style FAQ section with smooth animations.
 * Each FAQ item can be expanded/collapsed by clicking.
 */
export const BlogFAQ: React.FC<BlogFAQProps> = ({
  faqItems,
  openFAQIndex,
  onToggle,
  t,
}) => {
  if (faqItems.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="my-12"
    >
      <h2 className="text-2xl font-heading text-purple-200 mb-6">
        {t('blog.BlogPost.faq_title', 'Frequently Asked Questions')}
      </h2>
      <div className="space-y-3">
        {faqItems.map((item, index) => (
          <div
            key={index}
            className="bg-slate-900/60 rounded-xl border border-purple-500/20 overflow-hidden"
          >
            <button
              onClick={() => onToggle(openFAQIndex === index ? null : index)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-purple-500/5 transition-colors"
            >
              <span className="text-white font-medium pr-4">{item.question}</span>
              <ChevronDown
                className={`w-5 h-5 text-purple-400 flex-shrink-0 transition-transform duration-200 ${
                  openFAQIndex === index ? 'rotate-180' : ''
                }`}
              />
            </button>
            {openFAQIndex === index && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-4 pb-4"
              >
                <p className="text-slate-300 leading-relaxed">{item.answer}</p>
              </motion.div>
            )}
          </div>
        ))}
      </div>
    </motion.section>
  );
};
