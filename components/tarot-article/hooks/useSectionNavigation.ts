import { useState, useEffect, useCallback, RefObject } from 'react';
import { Section, getShortLabel } from '../types';

interface UseSectionNavigationProps {
  content: string | undefined;
  contentRef: RefObject<HTMLDivElement>;
}

interface UseSectionNavigationReturn {
  sections: Section[];
  activeSection: string;
  scrollToSection: (sectionId: string) => void;
}

/**
 * Hook to manage section navigation for article content
 * Extracts H2 headings, tracks active section on scroll, and provides scroll-to functionality
 */
export function useSectionNavigation({
  content,
  contentRef,
}: UseSectionNavigationProps): UseSectionNavigationReturn {
  const [sections, setSections] = useState<Section[]>([]);
  const [activeSection, setActiveSection] = useState('');

  // Extract sections from content
  useEffect(() => {
    if (!content) return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const headings = doc.querySelectorAll('h2');

    const extractedSections = Array.from(headings).map((h, i) => {
      const title = h.textContent?.replace(/[^\w\s&:'-]/g, '').trim() || `Section ${i + 1}`;
      return {
        id: `section-${i}`,
        title,
        shortLabel: getShortLabel(title),
      };
    });

    setSections(extractedSections);
  }, [content]);

  // Track active section on scroll
  useEffect(() => {
    if (!contentRef.current || sections.length === 0) return;

    const handleScroll = () => {
      const headings = contentRef.current?.querySelectorAll('h2');
      if (!headings) return;

      let currentActive = '';
      headings.forEach((heading, index) => {
        const rect = heading.getBoundingClientRect();
        if (rect.top <= 120) {
          currentActive = `section-${index}`;
        }
      });
      setActiveSection(currentActive);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections, contentRef]);

  // Scroll to section handler
  const scrollToSection = useCallback(
    (sectionId: string) => {
      const index = parseInt(sectionId.replace('section-', ''));
      if (contentRef.current) {
        const headings = contentRef.current.querySelectorAll('h2');
        const target = headings[index];
        if (target) {
          const offset = 80;
          const top = target.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      }
    },
    [contentRef]
  );

  return { sections, activeSection, scrollToSection };
}
