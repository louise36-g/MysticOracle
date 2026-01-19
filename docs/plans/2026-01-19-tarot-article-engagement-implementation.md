# Tarot Article Engagement Redesign - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add navigation aids and visual variety to tarot article pages to reduce reader drop-off.

**Architecture:** Enhance `TarotArticlePage.tsx` with new sub-components (ProgressBar, TableOfContents, QuickNav, ScrollToTop). Update prose styles in `index.html` for section-type styling and dividers.

**Tech Stack:** React 19, Framer Motion, Tailwind CSS, Lucide icons

---

## Task 1: Reading Progress Bar

**Files:**
- Modify: `components/TarotArticlePage.tsx`

**Step 1: Add progress bar component inside TarotArticlePage**

Add this component definition before the main component:

```tsx
// Reading progress indicator
function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setProgress(scrollPercent);
    };

    window.addEventListener('scroll', updateProgress, { passive: true });
    return () => window.removeEventListener('scroll', updateProgress);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-slate-900/80 backdrop-blur-sm">
      <motion.div
        className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500"
        style={{ width: `${progress}%` }}
      />
      <motion.div
        className="absolute top-0 h-full w-16 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
        style={{ left: `calc(${progress}% - 2rem)` }}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
    </div>
  );
}
```

**Step 2: Add ReadingProgress to the render output**

Inside the main component's return, add as first element after the Helmet:

```tsx
{/* Reading Progress Bar */}
<ReadingProgress />
```

**Step 3: Verify visually**

Run: `npm run dev`
Navigate to: `http://localhost:3000/tarot/articles/queen-of-swords-tarot-card-meaning`
Expected: Purple-to-fuchsia gradient bar at top that fills as you scroll

**Step 4: Commit**

```bash
git add components/TarotArticlePage.tsx
git commit -m "feat(tarot-article): add reading progress bar"
```

---

## Task 2: Scroll-to-Top Button

**Files:**
- Modify: `components/TarotArticlePage.tsx`

**Step 1: Add ScrollToTop component**

Add after ReadingProgress component:

```tsx
// Scroll to top button
function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 800);
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 p-3 bg-purple-600 hover:bg-purple-500 text-white rounded-full shadow-lg shadow-purple-500/25 transition-colors"
          aria-label="Scroll to top"
        >
          <ChevronUp className="w-5 h-5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
```

**Step 2: Add ChevronUp to imports**

Update the lucide-react import:

```tsx
import { Calendar, Clock, User, ArrowLeft, Tag, Sparkles, ZoomIn, ChevronUp } from 'lucide-react';
```

**Step 3: Ensure AnimatePresence is imported**

Check framer-motion import includes AnimatePresence:

```tsx
import { motion, AnimatePresence } from 'framer-motion';
```

**Step 4: Add ScrollToTop to render**

Add after ReadingProgress:

```tsx
<ReadingProgress />
<ScrollToTop />
```

**Step 5: Verify visually**

Scroll down 800px+ on article page
Expected: Purple circular button appears bottom-right, clicking scrolls to top

**Step 6: Commit**

```bash
git add components/TarotArticlePage.tsx
git commit -m "feat(tarot-article): add scroll-to-top button"
```

---

## Task 3: Quick Nav Chips

**Files:**
- Modify: `components/TarotArticlePage.tsx`

**Step 1: Add QuickNavChips component**

Add after ScrollToTop:

```tsx
// Quick navigation chips
function QuickNavChips({ sections, onSectionClick }: {
  sections: { id: string; title: string }[];
  onSectionClick: (id: string) => void;
}) {
  if (sections.length === 0) return null;

  const displaySections = sections.slice(0, 8);

  return (
    <div className="w-full overflow-x-auto scrollbar-hide py-4 -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="flex gap-2 min-w-max">
        {displaySections.map((section) => (
          <button
            key={section.id}
            onClick={() => onSectionClick(section.id)}
            className="px-4 py-2 bg-slate-800/80 hover:bg-purple-500/20 border border-purple-500/20 hover:border-purple-500/40 rounded-full text-sm text-purple-300 hover:text-purple-200 whitespace-nowrap transition-all"
          >
            {section.title.length > 25 ? section.title.slice(0, 25) + '...' : section.title}
          </button>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Add section detection state to main component**

Add these state variables and ref inside `TarotArticlePage`:

```tsx
const [sections, setSections] = useState<{ id: string; title: string }[]>([]);
const contentRef = useRef<HTMLDivElement>(null);
```

Ensure useRef is imported from React.

**Step 3: Add section extraction effect**

Add after the loadArticle effect:

```tsx
// Extract sections from content for navigation
useEffect(() => {
  if (!article?.content) return;

  const parser = new DOMParser();
  const doc = parser.parseFromString(article.content, 'text/html');
  const headings = doc.querySelectorAll('h2');

  const extractedSections = Array.from(headings).map((h, i) => ({
    id: `section-${i}`,
    title: h.textContent?.replace(/[^\w\s&:'-]/g, '').trim() || `Section ${i + 1}`
  }));

  setSections(extractedSections);
}, [article?.content]);
```

**Step 4: Add scroll-to-section handler**

Add this function inside the main component:

```tsx
const scrollToSection = useCallback((sectionId: string) => {
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
}, []);
```

Ensure useCallback is imported from React.

**Step 5: Add ref to content div**

Update the prose content div to include the ref:

```tsx
<motion.div
  ref={contentRef}
  initial={{ opacity: 0, y: 20 }}
  // ... rest
```

**Step 6: Add QuickNavChips to render**

Add after the header metadata badges section, before featured image:

```tsx
{/* Quick Navigation */}
{sections.length > 0 && (
  <QuickNavChips sections={sections} onSectionClick={scrollToSection} />
)}
```

**Step 7: Verify visually**

Refresh article page
Expected: Horizontal scrollable chips below metadata, clicking scrolls to section

**Step 8: Commit**

```bash
git add components/TarotArticlePage.tsx
git commit -m "feat(tarot-article): add quick navigation chips"
```

---

## Task 4: Floating Table of Contents (Desktop)

**Files:**
- Modify: `components/TarotArticlePage.tsx`

**Step 1: Add TableOfContents component**

Add after QuickNavChips:

```tsx
// Floating table of contents (desktop only)
function TableOfContents({
  sections,
  activeSection,
  onSectionClick
}: {
  sections: { id: string; title: string }[];
  activeSection: string;
  onSectionClick: (id: string) => void;
}) {
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  if (sections.length === 0) return null;

  return (
    <div className="hidden xl:block fixed right-8 top-1/2 -translate-y-1/2 z-40">
      <div className="flex flex-col items-center gap-2">
        {sections.slice(0, 8).map((section) => (
          <button
            key={section.id}
            onClick={() => onSectionClick(section.id)}
            onMouseEnter={() => setHoveredSection(section.id)}
            onMouseLeave={() => setHoveredSection(null)}
            className={`relative w-3 h-3 rounded-full transition-all duration-300 ${
              activeSection === section.id
                ? 'bg-purple-400 scale-125 shadow-[0_0_10px_rgba(168,85,247,0.5)]'
                : 'bg-slate-600 hover:bg-purple-400/50'
            }`}
            aria-label={section.title}
          >
            <AnimatePresence>
              {hoveredSection === section.id && (
                <motion.span
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="absolute right-6 top-1/2 -translate-y-1/2 whitespace-nowrap px-3 py-1.5 bg-slate-800/95 backdrop-blur-sm text-sm text-slate-200 rounded-lg border border-purple-500/20 pointer-events-none"
                >
                  {section.title.length > 30 ? section.title.slice(0, 30) + '...' : section.title}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        ))}
        {sections.length > 8 && (
          <span className="text-xs text-slate-500 mt-1">+{sections.length - 8}</span>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Add active section tracking state**

Add to main component state:

```tsx
const [activeSection, setActiveSection] = useState('');
```

**Step 3: Add scroll spy effect**

Add after section extraction effect:

```tsx
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
  handleScroll();
  return () => window.removeEventListener('scroll', handleScroll);
}, [sections]);
```

**Step 4: Add TableOfContents to render**

Add after ScrollToTop:

```tsx
<ScrollToTop />
<TableOfContents
  sections={sections}
  activeSection={activeSection}
  onSectionClick={scrollToSection}
/>
```

**Step 5: Verify visually**

View article on desktop (1280px+ width)
Expected: Dots on right side, active section glows, hover shows tooltip

**Step 6: Commit**

```bash
git add components/TarotArticlePage.tsx
git commit -m "feat(tarot-article): add floating table of contents"
```

---

## Task 5: Section-Type Styling (CSS)

**Files:**
- Modify: `index.html` (prose styles section)

**Step 1: Add section divider styling**

Add to the prose styles section in index.html, after existing styles:

```css
/* Section Dividers */
.prose h2 {
  position: relative;
  margin-top: 3.5rem;
  padding-top: 2.5rem;
}

.prose h2::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 50%;
  max-width: 200px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.4), transparent);
}
```

**Step 2: Add section-type styling**

Continue adding:

```css
/* Upright Section Styling */
.prose section[data-section="upright"],
.prose .section-upright {
  background: rgba(139, 92, 246, 0.03);
  border-left: 4px solid #8b5cf6;
  padding: 1.5rem;
  margin: 2rem 0;
  border-radius: 0 0.75rem 0.75rem 0;
}

/* Reversed Section Styling */
.prose section[data-section="reversed"],
.prose .section-reversed {
  background: rgba(15, 23, 42, 0.5);
  border-left: 4px solid rgba(251, 113, 133, 0.5);
  padding: 1.5rem;
  margin: 2rem 0;
  border-radius: 0 0.75rem 0.75rem 0;
}

.prose section[data-section="reversed"] h2,
.prose section[data-section="reversed"] h3,
.prose .section-reversed h2,
.prose .section-reversed h3 {
  color: #fda4af;
}
```

**Step 3: Verify visually**

Refresh article page
Expected: H2s have subtle gradient line above them

**Step 4: Commit**

```bash
git add index.html
git commit -m "feat(tarot-article): add section dividers and type styling"
```

---

## Task 6: Enhanced Blockquote & Special Block Styling

**Files:**
- Modify: `index.html`

**Step 1: Update blockquote styling**

Find and replace existing blockquote styles:

```css
/* Enhanced Blockquotes */
.prose blockquote {
  position: relative;
  border-left: 4px solid #8b5cf6;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(139, 92, 246, 0.03));
  margin: 2.5rem auto;
  padding: 1.5rem 2rem 1.5rem 2.5rem;
  border-radius: 0 0.75rem 0.75rem 0;
  font-style: italic;
  text-align: center;
  max-width: 90%;
  box-shadow: 0 4px 20px rgba(139, 92, 246, 0.08);
}

.prose blockquote::before {
  content: '"';
  position: absolute;
  top: 0.5rem;
  left: 0.75rem;
  font-size: 3rem;
  color: rgba(139, 92, 246, 0.25);
  font-family: Georgia, serif;
  line-height: 1;
}

.prose blockquote p {
  color: #e2e8f0;
  margin-bottom: 0;
  text-align: center;
  position: relative;
  z-index: 1;
}

.prose blockquote cite {
  display: block;
  margin-top: 1rem;
  font-size: 0.875rem;
  color: #a78bfa;
  font-style: normal;
  font-weight: 500;
}
```

**Step 2: Update key-takeaways styling**

```css
/* Key Takeaways Box */
.prose .key-takeaways {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(30, 41, 59, 0.5));
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-left: 4px solid #8b5cf6;
  padding: 1.5rem;
  margin: 2rem 0;
  border-radius: 0.75rem;
}

.prose .key-takeaways h3 {
  color: #c4b5fd;
  margin-top: 0;
  margin-bottom: 1rem;
  font-family: 'Cinzel', serif;
  text-align: left;
  border-bottom: none;
  padding-bottom: 0;
}

.prose .key-takeaways ul {
  margin-bottom: 0;
}
```

**Step 3: Update quick-reference styling**

```css
/* Quick Reference Table */
.prose .quick-reference {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.5), rgba(45, 35, 60, 0.3));
  border: 1px solid rgba(251, 191, 36, 0.2);
  padding: 1.5rem;
  margin: 2rem 0;
  border-radius: 0.75rem;
}

.prose .quick-reference h3 {
  color: #fcd34d;
  margin-top: 0;
  margin-bottom: 1rem;
  font-family: 'Cinzel', serif;
  text-align: left;
  border-bottom: none;
  padding-bottom: 0;
}

.prose .quick-reference table {
  margin: 0;
}

.prose .quick-reference td {
  padding: 0.5rem 0.75rem;
  border-color: rgba(251, 191, 36, 0.1);
}
```

**Step 4: Update CTA banner styling**

```css
/* CTA Banner */
.prose .cta-banner {
  background: linear-gradient(135deg, #7c3aed, #c026d3);
  color: white;
  padding: 2.5rem;
  margin: 3rem 0;
  border-radius: 1rem;
  text-align: center;
  box-shadow: 0 10px 40px rgba(124, 58, 237, 0.25);
}

.prose .cta-banner h3 {
  color: white;
  margin-top: 0;
  margin-bottom: 0.75rem;
  text-align: center;
  border-bottom: none;
  padding-bottom: 0;
}

.prose .cta-banner p {
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 1.5rem;
  text-align: center;
}

.prose .cta-banner a.btn,
.prose .cta-banner .btn {
  display: inline-block;
  background: white;
  color: #7c3aed;
  padding: 0.75rem 2rem;
  border-radius: 0.5rem;
  font-weight: 600;
  text-decoration: none;
  border-bottom: none;
  transition: transform 0.2s, box-shadow 0.2s;
}

.prose .cta-banner a.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  color: #7c3aed;
  border-bottom: none;
}
```

**Step 5: Verify visually**

Refresh and check key-takeaways, quick-reference, blockquotes, and CTA sections
Expected: Enhanced styling with gradients and proper spacing

**Step 6: Commit**

```bash
git add index.html
git commit -m "feat(tarot-article): enhance blockquote and special block styling"
```

---

## Task 7: FAQ Section Enhancement

**Files:**
- Modify: `index.html`

**Step 1: Update article-faq styling**

Find existing `.article-faq` styles and replace:

```css
/* Article FAQ Section */
.prose .article-faq {
  margin: 3rem 0;
  padding: 2rem;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.4), rgba(30, 41, 59, 0.2));
  border-radius: 1rem;
  border: 1px solid rgba(139, 92, 246, 0.15);
}

.prose .article-faq h2 {
  font-family: 'Cinzel', serif;
  font-size: 1.5rem;
  color: #d8b4fe;
  margin-bottom: 1.5rem;
  margin-top: 0;
  padding-top: 0;
  text-align: center;
  border-bottom: none;
}

.prose .article-faq h2::before {
  display: none;
}

.prose .article-faq > div {
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(139, 92, 246, 0.1);
  border-radius: 0.75rem;
  margin-bottom: 0.75rem;
  overflow: hidden;
  transition: border-color 0.2s;
}

.prose .article-faq > div:hover {
  border-color: rgba(139, 92, 246, 0.25);
}

.prose .article-faq > div:last-child {
  margin-bottom: 0;
}

.prose .article-faq h3 {
  font-family: 'Lato', sans-serif;
  font-size: 1rem;
  color: #e9d5ff;
  font-weight: 600;
  margin: 0;
  padding: 1rem 1.25rem;
  text-align: left;
  border-bottom: none;
}

.prose .article-faq p {
  color: #cbd5e1;
  margin: 0;
  padding: 0 1.25rem 1rem;
  line-height: 1.7;
  text-align: left;
}
```

**Step 2: Verify visually**

Scroll to FAQ section
Expected: Card-style FAQ items with hover effect

**Step 3: Commit**

```bash
git add index.html
git commit -m "feat(tarot-article): enhance FAQ section styling"
```

---

## Task 8: Spacing & Typography Adjustments

**Files:**
- Modify: `index.html`

**Step 1: Update paragraph spacing**

Find existing `.prose p` styles and update:

```css
.prose p {
  color: #cbd5e1;
  margin-bottom: 1.5rem;
  font-size: 1.125rem;
  line-height: 1.9;
}
```

**Step 2: Update image spacing**

Find existing `.prose img` styles and update:

```css
.prose img {
  border-radius: 0.75rem;
  margin: 3rem auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(139, 92, 246, 0.2);
}
```

**Step 3: Verify visually**

Refresh and review overall spacing
Expected: More breathing room between paragraphs and around images

**Step 4: Commit**

```bash
git add index.html
git commit -m "feat(tarot-article): adjust typography spacing"
```

---

## Task 9: Create LLM Style Guide

**Files:**
- Create: `docs/TAROT_ARTICLE_STYLE_GUIDE.md`

**Step 1: Create the style guide document**

Create comprehensive documentation for the article generator LLM covering:
- HTML structure templates for each section type
- CSS class reference
- Content guidelines (word counts, blockquote placement, structure)

**Step 2: Commit**

```bash
git add docs/TAROT_ARTICLE_STYLE_GUIDE.md
git commit -m "docs: add tarot article style guide for LLM content generation"
```

---

## Task 10: Final Testing

**Step 1: Run full visual test**

```bash
npm run dev
```

Navigate to: `http://localhost:3000/tarot/articles/queen-of-swords-tarot-card-meaning`

**Checklist:**
- [ ] Progress bar visible at top, fills on scroll
- [ ] Quick nav chips visible below header area
- [ ] Chips scroll horizontally on mobile
- [ ] TOC dots visible on right (desktop 1280px+)
- [ ] TOC tooltip on hover
- [ ] Active section dot glows
- [ ] Scroll-to-top appears after scrolling
- [ ] Section dividers visible between H2s
- [ ] Blockquotes styled with decorative quote mark
- [ ] Key-takeaways box styled
- [ ] Quick-reference table styled
- [ ] FAQ section styled
- [ ] CTA banner styled
- [ ] Mobile: TOC hidden, chips work

**Step 2: Final commit**

```bash
git add -A
git commit -m "feat(tarot-article): complete engagement redesign"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Progress Bar | TarotArticlePage.tsx |
| 2 | Scroll-to-Top | TarotArticlePage.tsx |
| 3 | Quick Nav Chips | TarotArticlePage.tsx |
| 4 | Table of Contents | TarotArticlePage.tsx |
| 5 | Section Dividers CSS | index.html |
| 6 | Special Blocks CSS | index.html |
| 7 | FAQ Enhancement CSS | index.html |
| 8 | Spacing Adjustments | index.html |
| 9 | LLM Style Guide | docs/TAROT_ARTICLE_STYLE_GUIDE.md |
| 10 | Final Testing | - |
