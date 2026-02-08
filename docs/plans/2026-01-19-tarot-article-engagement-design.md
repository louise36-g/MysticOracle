# Tarot Article Engagement Redesign

**Date:** 2026-01-19
**Status:** Approved
**Goal:** Reduce reader drop-off on long-form tarot articles (2,000-3,000 words) through navigation aids and visual variety while staying on-brand with CelestiArcana's mystical aesthetic.

---

## Problem Statement

Long tarot articles (~8-12 min read) risk reader drop-off due to scroll fatigue. The current design is functional but lacks engagement features to help readers navigate and stay focused through lengthy content.

## Design Principles

1. **Reader control** — Let readers navigate to sections that interest them
2. **Visual variety** — Break monotony with section-specific styling
3. **Breathing room** — Generous spacing and visual dividers prevent fatigue
4. **On-brand** — Mystical aesthetic with purple/fuchsia palette, Cinzel headings
5. **Mobile-first** — Core features work on all devices; enhanced features on desktop

---

## Feature Specifications

### 1. Reading Progress Bar

**Location:** Fixed at top of viewport (below any existing header)

**Behavior:**
- Thin bar (4px height) showing scroll progress through article
- Gradient: purple-500 → fuchsia-500 (no gold)
- Subtle shimmer animation on current position
- Appears on all devices

**Implementation:** Track scroll position relative to article content height.

---

### 2. Floating Table of Contents (Desktop Only)

**Location:** Fixed, right side, vertically centered

**Behavior:**
- Appears after scrolling past hero section
- Shows H2 sections as small dots (max 6 visible, "+N" indicator if more)
- Active section highlighted with purple glow
- Hover reveals section title as tooltip
- Click smooth-scrolls to section
- Hidden on screens < 1280px (xl breakpoint)

**Visual:**
- Dots: 12px, slate-600 default, purple-400 when active
- Tooltip: slate-800 background, purple border, appears to left of dot

---

### 3. Quick Nav Chips

**Location:** Below hero section, above article content

**Behavior:**
- Horizontal scrollable row of section links
- Shows key sections: `Upright · Reversed · Love · Career · Symbolism · FAQ`
- Tap/click smooth-scrolls to section
- NOT sticky (scrolls with page)
- Visible on all devices

**Visual:**
- Chip style: slate-800 background, purple-500/20 border, purple-300 text
- Active/hover: purple-500/30 background
- Horizontal scroll with hidden scrollbar on mobile

---

### 4. Scroll-to-Top Button

**Location:** Fixed, bottom-right corner

**Behavior:**
- Appears after scrolling 800px
- Click smooth-scrolls to top
- Visible on all devices (essential for mobile)

**Visual:**
- Circular button, purple-600 background
- ChevronUp icon, white
- Subtle shadow: purple-500/25

---

### 5. Section-Type Styling

#### 5.1 Upright Section
- Background: purple-500/5 (very subtle tint)
- Left border: 4px solid purple-500
- Heading: includes upward chevron or sun icon
- Padding: 2rem

#### 5.2 Reversed Section
- Background: slate-900/60 (darker)
- Left border: 4px solid rose-400/60
- Heading: includes downward chevron or moon icon
- Heading color: rose-200 instead of purple-200
- Padding: 2rem

#### 5.3 Life Area Sub-sections (H3)
Each gets a small icon (16px) and subtle background tint:

| Section | Icon | Tint Color |
|---------|------|------------|
| Love & Relationships | Heart | rose-500/10 |
| Career & Work | Briefcase | amber-500/10 |
| Finances | Coins | emerald-500/10 |
| Spirituality | Moon | violet-500/10 |
| Life Decisions | Compass | blue-500/10 |

#### 5.4 Existing Special Blocks (Restyle)
- `.key-takeaways` — slate-800/50 background, purple left border, rounded
- `.quick-reference` — slate-900/50 background, amber-500/20 border
- `.article-faq` — slate-800/30 background, purple-500/20 border
- `.cta-banner` — gradient purple-600 → fuchsia-600, white text

---

### 6. Visual Dividers

**Between H2 Sections:**
- Horizontal gradient line: transparent → purple-500/30 → transparent
- Centered icon cluster: Star + Moon + Star (small, muted)
- Vertical padding: 3rem above and below

**Implementation:** CSS `::after` pseudo-element on H2, or explicit `<SectionDivider />` component.

---

### 7. Typography & Spacing Adjustments

| Property | Current | New |
|----------|---------|-----|
| Line height (prose) | 1.8 | 1.9 |
| Paragraph margin-bottom | 1.25rem | 1.5rem |
| Image vertical margin | 2rem | 3rem |
| H2 margin-top | 2.5rem | 3rem |

**Blockquotes:**
- Center-aligned
- Decorative quotation marks via `::before` pseudo-element
- Subtle purple glow background
- Citation styled distinctly below quote

---

### 8. FAQ Accordion

**Behavior:**
- First item expanded by default
- Remaining items collapsed
- Click to toggle open/close
- Smooth height animation (300ms)

**Visual:**
- Container: slate-900/50 background, purple-500/20 border, rounded-xl
- Question row: clickable, hover state, chevron icon rotates
- Answer: border-top separator, padding

---

### 9. Mobile Adaptations

| Feature | Mobile (< 1024px) | Desktop (≥ 1024px) |
|---------|-------------------|-------------------|
| Progress bar | Yes | Yes |
| Floating TOC | No | Yes |
| Floating share bar | No | Yes |
| Quick nav chips | Yes (scrollable) | Yes |
| Scroll-to-top | Yes | Yes |
| Share actions | Native share sheet | Individual buttons |

---

## Files to Modify

1. **`components/TarotArticlePage.tsx`** — Add progress bar, TOC, quick nav, scroll-to-top, section detection
2. **`index.html`** — Update `.prose` styles for section-type styling, dividers, spacing
3. **`styles/main.css`** — Add new animation keyframes, utility classes
4. **New: `docs/TAROT_ARTICLE_STYLE_GUIDE.md`** — LLM documentation for article generation

---

## LLM Documentation Deliverable

Create `docs/TAROT_ARTICLE_STYLE_GUIDE.md` containing:

1. **HTML Structure Templates** — Exact markup for each section type
2. **CSS Class Reference** — All semantic classes with descriptions
3. **Content Guidelines** — Blockquote placement, image guidance, FAQ rules, section ordering

Format: Markdown, structured for LLM parsing.

---

## Out of Scope

- Progressive reveal animations (rejected in favor of navigation focus)
- Gold accent color (removed per user preference)
- Sticky quick nav chips (rejected)
- Yes/No section styling (not in current template)

---

## Success Criteria

1. Readers can jump to any section within 2 clicks/taps
2. Visual distinction between Upright and Reversed sections is immediately obvious
3. Articles feel less like "walls of text" due to dividers and spacing
4. LLM can generate properly-formatted articles using the style guide
5. Mobile experience is streamlined, not cluttered
