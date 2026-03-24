import React, { useMemo, useRef, useEffect } from 'react';
import { BlogPost as BlogPostType, LinkRegistry, FAQItem } from '../../services/api';
import { ContentProcessor, ImageLayoutManager } from '../../services/blog';

interface UseBlogContentParams {
  post: BlogPostType | null;
  linkRegistry: LinkRegistry | null;
  language: 'en' | 'fr';
}

interface UseBlogContentReturn {
  contentBeforeFAQ: string;
  contentAfterFAQ: string;
  extractedFAQs: FAQItem[];
  contentRef: React.RefObject<HTMLDivElement>;
}

/**
 * useBlogContent
 * Processes blog post content using ContentProcessor and ImageLayoutManager services
 */
export function useBlogContent({
  post,
  linkRegistry,
  language
}: UseBlogContentParams): UseBlogContentReturn {
  const contentRef = useRef<HTMLDivElement>(null);

  // Get raw content based on language
  const rawContent = post ? (language === 'en' ? post.contentEn : post.contentFr) : '';

  // Check if this is a Tarot Numerology category article
  const isTarotNumerology = post?.categories.some(cat => cat.slug === 'tarot-numerology') || false;

  // Get stored FAQs from database
  const storedFAQs = (post?.faq as FAQItem[]) || [];

  // Process content using ContentProcessor service
  const { contentBeforeFAQ, contentAfterFAQ, extractedFAQs } = useMemo(() => {
    const processor = new ContentProcessor();
    return processor.processContent(
      rawContent,
      linkRegistry,
      isTarotNumerology,
      storedFAQs
    );
  }, [rawContent, linkRegistry, isTarotNumerology, storedFAQs]);

  // Adjust portrait image sizes after they load (using ImageLayoutManager)
  useEffect(() => {
    if (!contentRef.current) return;

    const imageLayoutManager = new ImageLayoutManager();
    imageLayoutManager.adjustImageSizes(contentRef.current);
  }, [contentBeforeFAQ, contentAfterFAQ]);

  // ── Suit Navigation Bar (for hub pages with .suit-nav) ──
  // Sets up: smooth scroll on click, Intersection Observer for active state,
  // and visibility toggle when scrolled past the hero section.
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const nav = container.querySelector<HTMLElement>('.suit-nav');
    if (!nav) return; // page doesn't have a suit nav — nothing to do

    // Collect anchor targets referenced by the nav links
    const links = Array.from(nav.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'));
    const sectionIds = links.map(a => a.getAttribute('href')!.slice(1));
    const sections = sectionIds
      .map(id => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    // ── Smooth scroll on click ──
    const handleClick = (e: Event) => {
      const anchor = (e.target as HTMLElement).closest('a[href^="#"]') as HTMLAnchorElement | null;
      if (!anchor) return;
      e.preventDefault();
      const id = anchor.getAttribute('href')!.slice(1);
      const target = document.getElementById(id);
      if (target) {
        const headerOffset = 56 + nav.offsetHeight + 12; // header + nav + gap
        const top = target.getBoundingClientRect().top + window.scrollY - headerOffset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    };
    nav.addEventListener('click', handleClick);

    // ── Active section tracking via Intersection Observer ──
    let currentActiveId = '';
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            currentActiveId = entry.target.id;
          }
        }
        links.forEach(link => {
          const href = link.getAttribute('href')!.slice(1);
          link.classList.toggle('active', href === currentActiveId);
        });
      },
      { rootMargin: '-20% 0px -60% 0px' }
    );
    sections.forEach(s => observer.observe(s));

    // ── Show/hide nav based on scroll position ──
    // Fade in after scrolling 300px (past the hero area)
    const handleScroll = () => {
      nav.classList.toggle('visible', window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // initial check

    return () => {
      nav.removeEventListener('click', handleClick);
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [contentBeforeFAQ, contentAfterFAQ]);

  return {
    contentBeforeFAQ,
    contentAfterFAQ,
    extractedFAQs,
    contentRef
  };
}
