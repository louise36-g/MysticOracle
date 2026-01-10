# Tarot Cards Overview Page - Design Document

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:writing-plans to create the implementation plan from this design.

**Goal:** Create a beautiful, SEO-optimized Tarot Cards overview page that gives users a visual tour of the 78-card deck, organized by category with easy navigation to detailed articles.

**Architecture:** New page accessible from Learn dropdown, featuring category sections with horizontal card rows, element-themed styling, and dedicated pages for browsing all cards or specific categories.

**Tech Stack:** React, TypeScript, Tailwind CSS, Framer Motion, existing API infrastructure

---

## 1. Page Structure & Navigation

### URL Structure
| Page | URL | Purpose |
|------|-----|---------|
| Overview | `/tarot/cards` | Main entry point, shows all categories |
| All Cards | `/tarot/cards/all` | Full 78-card grid with filtering |
| Category | `/tarot/cards/major-arcana` | All cards in specific category |
| Article | `/tarot/[slug]` | Individual card article (existing) |

### Navigation Integration
- Add "Tarot Cards" to Learn dropdown in `SubNav.tsx`
- Position: After "Blog"
- Icon: `Layers` from Lucide (or similar deck/cards icon)
- Label EN: "Tarot Cards"
- Label FR: "Cartes de Tarot"
- Description EN: "Explore all 78 cards"
- Description FR: "Explorez les 78 cartes"

### Overview Page Layout (Top to Bottom)
1. **Hero Section** - Mystical gradient background, title, intro, "Browse All 78 Cards" CTA
2. **Major Arcana Section** - First category (most important)
3. **Suit of Wands Section** - Fire element
4. **Suit of Cups Section** - Water element
5. **Suit of Swords Section** - Air element
6. **Suit of Pentacles Section** - Earth element
7. **Bottom CTA Section** - "Browse All Cards" button + "Get a Reading" link

### Breadcrumbs
- Overview: `Home → Tarot Cards`
- Category: `Home → Tarot Cards → Major Arcana`
- Article: `Home → Tarot Cards → Major Arcana → The Fool`

---

## 2. Visual Design

### Hero Section
- Full-width gradient background (deep purple → slate, matching site)
- Centered content layout
- Title: Cinzel font, gradient text effect
- Body: Lato font, purple-300 color
- Decorative: Subtle star/sparkle particles in background
- CTA Button: Purple gradient, prominent placement
- Bottom CTA: Repeated after all sections for users who scroll

### Element Color Palette
| Category | Primary Color | Accent | Element |
|----------|--------------|--------|---------|
| Major Arcana | `#a78bfa` (purple) | `#fbbf24` (gold) | Cosmic |
| Suit of Wands | `#f97316` (orange) | `#fbbf24` (amber) | Fire |
| Suit of Cups | `#06b6d4` (cyan) | `#3b82f6` (blue) | Water |
| Suit of Swords | `#94a3b8` (silver) | `#e2e8f0` (light) | Air |
| Suit of Pentacles | `#22c55e` (green) | `#a3e635` (lime) | Earth |

### Category Section Header
```
┌─────────────────────────────────────────────────────────────────┐
│ [Element Icon]  Major Arcana                    View All 22 → │
│ ─────────────── (element-colored underline)                    │
└─────────────────────────────────────────────────────────────────┘
```
- Element icon from Lucide: `Sparkles` (Major), `Flame` (Wands), `Droplets` (Cups), `Wind` (Swords), `Mountain` (Pentacles)
- Category name in Cinzel font
- Element-colored underline accent
- "View All X →" link aligned right

### Card Component
```
┌─────────────────────────┐
│                         │
│   Featured Image 16:9   │  ← Existing article thumbnails
│                         │
├─────────────────────────┤
│  0 · Major Arcana       │  ← Card number + category (on All Cards page only)
│  The Fool               │  ← Title in Cinzel
│  New beginnings and...  │  ← Excerpt, 2 lines max, Lato font
└─────────────────────────┘
```

**Context-aware metadata:**
- On category sections: Card number + Title + Excerpt (category implied by section)
- On All Cards page: Card number + Category + Title + Excerpt

### Card Hover States
- Card lifts: `translateY(-4px)`
- Border glow: Element color with 30% opacity shadow
- Image zoom: `scale(1.02)` with overflow hidden
- Transition: 200ms ease-out

---

## 3. Grid & Layout Specifications

### Grid Columns
| Breakpoint | Columns | Context |
|------------|---------|---------|
| Desktop (1280px+) | 4 | All pages |
| Tablet (768px-1279px) | 3 | All pages |
| Mobile (< 768px) | 2 | All Cards grid |
| Mobile (< 768px) | 1 + peek | Category rows |

### Category Section Rows (Horizontal Scroll)
- Desktop: 4 full cards visible + 5th card peeking (~20% visible)
- Tablet: 3 full cards visible + 4th card peeking
- Mobile: 1 full card visible + 2nd card peeking
- Scroll behavior: `overflow-x: auto`, styled/hidden scrollbar
- Right edge: Subtle fade gradient overlay
- Optional: Arrow buttons on hover (desktop)

### Incomplete Row Handling
- Cards maintain consistent width
- Incomplete final rows are **centered**
- CSS: `justify-center` on grid container
- Creates balanced, intentional appearance

---

## 4. All Cards Page

### URL
`/tarot/cards/all`

### Layout
1. Hero section (consistent with overview)
2. Filter bar with category pills
3. Sort dropdown
4. Responsive card grid
5. Pagination or infinite scroll

### Filter Bar
- Pills: All, Major Arcana, Wands, Cups, Swords, Pentacles
- Active state: Purple background, white text
- Inactive state: Slate background, hover effect
- Mobile: Horizontally scrollable pills
- Filtering is client-side (no URL change)

### Sorting Options
- **Sequential Order** (default) - Traditional tarot order by card number
- **A-Z** - Alphabetical by title
- **Z-A** - Reverse alphabetical

### SEO
- Title: "All 78 Tarot Cards - Complete Deck Guide | MysticOracle"
- Meta: "Browse all 78 tarot cards with detailed meanings. Major Arcana, Wands, Cups, Swords, and Pentacles explained."

---

## 5. Category Pages

### URL Pattern
`/tarot/cards/[category-slug]`

| Category | Slug | Card Count |
|----------|------|------------|
| Major Arcana | `major-arcana` | 22 |
| Suit of Wands | `wands` | 14 |
| Suit of Cups | `cups` | 14 |
| Suit of Swords | `swords` | 14 |
| Suit of Pentacles | `pentacles` | 14 |

### Layout
- Hero with category name and element icon
- Full grid of all cards in category
- Same sorting options as All Cards page
- Breadcrumbs for navigation

### SEO (Example: Major Arcana)
- Title: "Major Arcana Tarot Cards - All 22 Cards Explained | MysticOracle"
- Meta: "Discover the 22 Major Arcana cards. From The Fool to The World, learn the deep symbolism and meanings."
- Structured data: ItemList schema

---

## 6. Mobile Experience

### Overview Page
- Hero stacks vertically
- CTA button full-width
- Category sections: Horizontal swipe carousel
- Scroll indicators: Fade edges showing content continues
- Touch targets: Minimum 44px

### All Cards / Category Pages
- Filter pills horizontally scrollable
- 2-column card grid
- Sticky filter bar on scroll

### Navigation
- Back button returns to previous page
- Preserve scroll position when returning from article

---

## 7. SEO Implementation

### Overview Page Meta
```html
<title>Tarot Card Meanings - Complete Guide to All 78 Cards | MysticOracle</title>
<meta name="description" content="Explore the complete tarot deck. Learn the meanings of all 78 cards including Major Arcana and Minor Arcana suits of Wands, Cups, Swords, and Pentacles." />
<link rel="canonical" href="https://mysticoracle.com/tarot/cards" />
```

### Heading Structure
- H1: "The Tarot Deck" (one per page)
- H2: Category names ("Major Arcana", "Suit of Wands", etc.)

### Structured Data
- Overview: WebPage schema with ItemList of categories
- Category pages: ItemList schema with article items
- Individual articles: Article schema (existing)

### Internal Linking
- Each card links to full article
- Category sections link to category pages
- Breadcrumbs provide upward navigation
- Related cards in articles link back to overview

---

## 8. Technical Implementation

### New Components
| Component | Purpose |
|-----------|---------|
| `TarotCardsOverview.tsx` | Main overview page with all sections |
| `TarotCategorySection.tsx` | Reusable horizontal card row with header |
| `TarotCardPreview.tsx` | Individual card component |
| `TarotCardsAll.tsx` | Full grid page with filtering/sorting |
| `TarotCardsCategory.tsx` | Single category page |

### API Requirements

**Option A: Batch Endpoint (Recommended)**
New endpoint to fetch overview data in single request:
```
GET /api/tarot-articles/overview
Response: {
  majorArcana: TarotArticle[] (first 4, sorted by cardNumber),
  wands: TarotArticle[],
  cups: TarotArticle[],
  swords: TarotArticle[],
  pentacles: TarotArticle[],
  counts: { majorArcana: 22, wands: 14, ... }
}
```

**Option B: Parallel Requests**
Fetch 5 requests in parallel using existing endpoint:
```
GET /api/tarot-articles?cardType=MAJOR_ARCANA&limit=4&orderBy=cardNumber
GET /api/tarot-articles?cardType=SUIT_OF_WANDS&limit=4&orderBy=cardNumber
...
```

### Routing Updates (App.tsx)
```typescript
// New views to add
'tarot-cards'          // Overview page
'tarot-cards-all'      // All cards grid
'tarot-cards-category' // Single category page
```

### SubNav Updates
Add to `learnItems` array in `SubNav.tsx`:
```typescript
{
  id: 'tarot-cards',
  labelEn: 'Tarot Cards',
  labelFr: 'Cartes de Tarot',
  descriptionEn: 'Explore all 78 cards',
  descriptionFr: 'Explorez les 78 cartes',
  icon: <Layers className="w-4 h-4 text-purple-400" />,
  iconBg: 'bg-purple-500/20',
  onClick: () => onNavigate('tarot-cards')
}
```

---

## 9. Empty States

### No Articles in Category
Display a graceful empty state:
- Mystical illustration (stars, cards silhouette)
- Message: "We're writing about these cards. Check back soon!"
- Link to other categories with content

### Loading States
- Skeleton loaders matching card dimensions
- Skeleton for category headers
- Staggered animation for visual polish

---

## 10. Success Criteria

### UX Goals
- [ ] Users can browse all 78 cards by category
- [ ] Sequential tarot order is default sorting
- [ ] Peeking cards signal scrollable content
- [ ] Mobile experience is touch-friendly
- [ ] Navigation is intuitive with clear breadcrumbs

### SEO Goals
- [ ] Each page has unique, optimized title/meta
- [ ] Proper heading hierarchy (H1 → H2)
- [ ] Structured data for rich snippets
- [ ] Internal linking strengthens site structure
- [ ] Category pages are indexable

### Performance Goals
- [ ] Overview loads in single API request (batch endpoint)
- [ ] Images lazy-loaded below fold
- [ ] Smooth 60fps animations
- [ ] Mobile-first responsive design

---

## Appendix: Visual Reference

### Overview Page Wireframe
```
┌─────────────────────────────────────────────────────────────────┐
│                           HEADER                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                      ✦ The Tarot Deck ✦                        │
│         Explore the ancient wisdom of all 78 cards              │
│                   [ Browse All 78 Cards ]                       │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ ✦ Major Arcana                                    View All 22 → │
│ ───────────────                                                 │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────                │
│ │ Fool   │ │Magician│ │ H.Prs  │ │Empress │ │ Emp...            │
│ └────────┘ └────────┘ └────────┘ └────────┘ └────                │
├─────────────────────────────────────────────────────────────────┤
│ 🔥 Suit of Wands                                  View All 14 → │
│ ────────────────                                                │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────                │
│ │Ace     │ │ Two    │ │ Three  │ │ Four   │ │ Fiv...            │
│ └────────┘ └────────┘ └────────┘ └────────┘ └────                │
├─────────────────────────────────────────────────────────────────┤
│                         ... more sections ...                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│              Ready to explore the full deck?                    │
│                   [ Browse All 78 Cards ]                       │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                           FOOTER                                │
└─────────────────────────────────────────────────────────────────┘
```

---

*Design completed: 2026-01-10*
*Ready for implementation planning*
