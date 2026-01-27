import { useState, useEffect, useCallback, RefObject } from 'react';
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
 * Each has a label and patterns to match headings
 */
const FIXED_NAV_SECTIONS = [
  {
    shortLabel: 'Takeaways',
    match: (title: string) => title.toLowerCase().includes('key takeaways'),
  },
  {
    shortLabel: 'Overview',
    // Match main card section (H2 with colon pattern like "The Fool: The Spirit of Beginning")
    match: (title: string) => {
      const lower = title.toLowerCase();
      const excluded = ['reversed', 'key takeaways', 'faq', 'frequently', 'guidance', 'upright', 'symbol'];
      return title.includes(':') && !excluded.some(e => lower.includes(e));
    },
  },
  {
    shortLabel: 'Upright',
    // Match H3 like "When The Fool Appears Upright"
    match: (title: string) => title.toLowerCase().includes('upright'),
  },
  {
    shortLabel: 'Reversed',
    match: (title: string) => title.toLowerCase().includes('reversed'),
  },
  {
    shortLabel: 'Symbols',
    // Match H3 like "Symbols in The Fool"
    match: (title: string) => {
      const lower = title.toLowerCase();
      return lower.includes('symbol') || lower.includes('imagery');
    },
  },
  {
    shortLabel: 'FAQ',
    match: (title: string) => {
      const lower = title.toLowerCase();
      return lower.includes('faq') || lower.includes('frequently asked') || lower.includes('frequently asked questions');
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
      // First try H2 headings
      let matchIndex = h2Headings.findIndex((h) => {
        const title = h.textContent?.replace(/[^\w\s&:'-]/g, '').trim() || '';
        return navSection.match(title);
      });

      if (matchIndex !== -1) {
        const h = h2Headings[matchIndex];
        const title = h.textContent?.replace(/[^\w\s&:'-]/g, '').trim() || '';
        foundSections.push({
          id: `h2-${matchIndex}`,
          title,
          shortLabel: navSection.shortLabel,
        });
        continue;
      }

      // If not found in H2, try H3 headings (for Upright, Symbols)
      matchIndex = h3Headings.findIndex((h) => {
        const title = h.textContent?.replace(/[^\w\s&:'-]/g, '').trim() || '';
        return navSection.match(title);
      });

      if (matchIndex !== -1) {
        const h = h3Headings[matchIndex];
        const title = h.textContent?.replace(/[^\w\s&:'-]/g, '').trim() || '';
        foundSections.push({
          id: `h3-${matchIndex}`,
          title,
          shortLabel: navSection.shortLabel,
        });
      }
    }

    setSections(foundSections);
  }, [content]);

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
