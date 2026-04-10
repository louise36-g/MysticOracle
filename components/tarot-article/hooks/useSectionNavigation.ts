import { useState, useEffect, useCallback, RefObject } from 'react';
import { useApp } from '../../../context/AppContext';
import { Section } from '../types';

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
 * Fixed navigation sections in desired order
 * Each has EN/FR labels and patterns to match headings in both languages
 */
const FIXED_NAV_SECTIONS = [
  {
    labelEn: 'Takeaways',
    labelFr: 'À retenir',
    match: (title: string) => {
      const lower = title.toLowerCase();
      return lower.includes('key takeaways') || lower.includes('à retenir');
    },
  },
  {
    labelEn: 'Overview',
    labelFr: 'Aperçu',
    // Match main card section (H2 with colon pattern)
    match: (title: string) => {
      const lower = title.toLowerCase();
      const excluded = ['reversed', 'key takeaways', 'faq', 'frequently', 'guidance', 'upright', 'symbol',
        'à retenir', 'questions', 'à l\'endroit', 'à l\'envers', 'symboli'];
      return title.includes(':') && !excluded.some(e => lower.includes(e));
    },
  },
  {
    labelEn: 'Upright',
    labelFr: 'À l\'endroit',
    match: (title: string) => {
      const lower = title.toLowerCase();
      return lower.includes('upright') || lower.includes('à l\u2019endroit') || lower.includes('à l\'endroit');
    },
  },
  {
    labelEn: 'Reversed',
    labelFr: 'À l\'envers',
    match: (title: string) => {
      const lower = title.toLowerCase();
      return lower.includes('reversed') || lower.includes('à l\u2019envers') || lower.includes('à l\'envers');
    },
  },
  {
    labelEn: 'Symbols',
    labelFr: 'Symboles',
    match: (title: string) => {
      const lower = title.toLowerCase();
      return lower.includes('symbol') || lower.includes('imagery') || lower.includes('symbolisme');
    },
  },
  {
    labelEn: 'FAQ',
    labelFr: 'FAQ',
    match: (title: string) => {
      const lower = title.toLowerCase();
      return lower.includes('faq') || lower.includes('frequently asked') || lower.includes('questions fréquentes') || lower.includes('questions posées');
    },
  },
];

/**
 * Hook to manage section navigation for article content
 * Extracts H2 headings, tracks active section on scroll, and provides scroll-to functionality
 */
export function useSectionNavigation({
  content,
  contentRef,
}: UseSectionNavigationProps): UseSectionNavigationReturn {
  const { language } = useApp();
  const [sections, setSections] = useState<Section[]>([]);
  const [activeSection, setActiveSection] = useState('');

  // Extract sections from content using fixed navigation structure
  useEffect(() => {
    if (!content) return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');

    // Get all H2 and H3 headings with their indices
    const h2Headings = Array.from(doc.querySelectorAll('h2'));
    const h3Headings = Array.from(doc.querySelectorAll('h3'));

    // Combine H2 and H3 with type markers for scroll targeting
    const allHeadings = [
      ...h2Headings.map((h, i) => ({ el: h, type: 'h2' as const, index: i })),
      ...h3Headings.map((h, i) => ({ el: h, type: 'h3' as const, index: i })),
    ];

    // For each fixed nav section, find the first matching heading (H2 or H3)
    const foundSections: Section[] = [];

    for (const navSection of FIXED_NAV_SECTIONS) {
      // First try H2 headings — use raw textContent for matching (preserves French accents/apostrophes)
      let matchIndex = h2Headings.findIndex((h) => {
        const title = h.textContent?.trim() || '';
        return navSection.match(title);
      });

      const shortLabel = language === 'fr' ? navSection.labelFr : navSection.labelEn;

      if (matchIndex !== -1) {
        const h = h2Headings[matchIndex];
        const title = h.textContent?.replace(/[^\w\s&:'-àâéèêëïîôùûüç]/g, '').trim() || '';
        foundSections.push({
          id: `h2-${matchIndex}`,
          title,
          shortLabel,
        });
        continue;
      }

      // If not found in H2, try H3 headings (for Upright, Symbols)
      matchIndex = h3Headings.findIndex((h) => {
        const title = h.textContent?.trim() || '';
        return navSection.match(title);
      });

      if (matchIndex !== -1) {
        const h = h3Headings[matchIndex];
        const title = h.textContent?.replace(/[^\w\s&:'-àâéèêëïîôùûüç]/g, '').trim() || '';
        foundSections.push({
          id: `h3-${matchIndex}`,
          title,
          shortLabel,
        });
      }
    }

    setSections(foundSections);
  }, [content, language]);

  // Track active section on scroll
  useEffect(() => {
    if (!contentRef.current || sections.length === 0) return;

    // Get the set of section IDs we're tracking
    const trackedSectionIds = new Set(sections.map((s) => s.id));

    const handleScroll = () => {
      const h2Headings = contentRef.current?.querySelectorAll('h2');
      const h3Headings = contentRef.current?.querySelectorAll('h3');
      if (!h2Headings || !h3Headings) return;

      let currentActive = '';

      // Check H2 headings
      h2Headings.forEach((heading, index) => {
        const sectionId = `h2-${index}`;
        if (trackedSectionIds.has(sectionId)) {
          const rect = heading.getBoundingClientRect();
          if (rect.top <= 120) {
            currentActive = sectionId;
          }
        }
      });

      // Check H3 headings
      h3Headings.forEach((heading, index) => {
        const sectionId = `h3-${index}`;
        if (trackedSectionIds.has(sectionId)) {
          const rect = heading.getBoundingClientRect();
          if (rect.top <= 120) {
            currentActive = sectionId;
          }
        }
      });

      // Only update state if the active section actually changed
      setActiveSection((prev) => (prev !== currentActive ? currentActive : prev));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections, contentRef]);

  // Scroll to section handler
  const scrollToSection = useCallback(
    (sectionId: string) => {
      if (!contentRef.current) return;

      let target: Element | null = null;

      if (sectionId.startsWith('h2-')) {
        const index = parseInt(sectionId.replace('h2-', ''));
        const headings = contentRef.current.querySelectorAll('h2');
        target = headings[index];
      } else if (sectionId.startsWith('h3-')) {
        const index = parseInt(sectionId.replace('h3-', ''));
        const headings = contentRef.current.querySelectorAll('h3');
        target = headings[index];
      }

      if (target) {
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    },
    [contentRef]
  );

  return { sections, activeSection, scrollToSection };
}
