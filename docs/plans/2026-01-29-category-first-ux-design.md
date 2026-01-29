# Category-First UX Restructure Design

> **For Claude:** Use superpowers:writing-plans to create the implementation plan from this design.

**Goal:** Replace spread-first navigation with category-first navigation, where users choose a life theme (Love, Career, etc.) then select reading depth (1-10 cards).

**Architecture:** 6 category cards in a 2×3 grid. Clicking a category expands the card inline to reveal depth options as visual card stacks. Selecting depth navigates to a simplified IntroPhase (or Birth Date entry for Birth Cards).

**Tech Stack:** React, TypeScript, Framer Motion, Tailwind CSS

---

## Core Decisions

| Aspect | Decision |
|--------|----------|
| **Navigation model** | Category-first (replaces spread-first) |
| **Categories** | Love, Career, Money, Life Path, Family, Birth Cards |
| **Grid layout** | 2×3 balanced grid, all categories equal |
| **Expansion behavior** | Card expands inline, others fade/shrink |
| **Depth options** | Visual card stacks showing 1, 3, 5, 7, 10 cards |
| **All depths for all** | Yes - every category offers all 5 depths |
| **Layout picker** | Smart default + collapsible "Change layout" option |
| **Birth Cards** | Special flow with birth date entry, static meanings |
| **Old URLs** | Remove entirely (clean start, not yet in production) |

---

## User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  CATEGORY SELECTOR (replaces SpreadSelector)                    │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                           │
│  │  Love   │ │ Career  │ │  Money  │                           │
│  └─────────┘ └─────────┘ └─────────┘                           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                           │
│  │Life Path│ │ Family  │ │ Birth   │                           │
│  └─────────┘ └─────────┘ │ Cards   │                           │
│                          └─────────┘                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ click category
┌─────────────────────────────────────────────────────────────────┐
│  EXPANDED CARD (inline, other cards fade/shrink)               │
│  ┌─────────────────────────────────────────────────┐           │
│  │  ♥ LOVE                                    [×]  │           │
│  │  How deep would you like to go?                 │           │
│  │  [1]   [3]    [5]     [7]      [10]            │           │
│  │   ●    ●●●   ●●●●●   ●●●●●●●  ●●●●●●●●●●       │           │
│  │  1cr   3cr   5cr     7cr      10cr             │           │
│  └─────────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ click depth
┌─────────────────────────────────────────────────────────────────┐
│  INTRO PHASE (simplified)                                       │
│  - Category badge shown (pre-selected)                         │
│  - Smart default layout (collapsible "Change layout")          │
│  - Question selector (suggested + custom)                      │
│  - Advanced style toggle                                       │
│  - Cost display + Start button                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────┴─────────────────────┐
        │                                           │
   Regular categories                          Birth Cards
        │                                           │
        ▼                                           ▼
   Drawing Phase                            Birth Date Entry
        │                                           │
        ▼                                           ▼
   Reveal Phase ◄───────────────────────────────────┘
        │
        ▼
   Interpretation
```

---

## Category Visual Identity

| Category | Icon | Color Theme | Tagline EN | Tagline FR |
|----------|------|-------------|------------|------------|
| **Love** | Heart | Rose/Pink | Matters of the Heart | Affaires du Cœur |
| **Career** | Briefcase | Amber/Gold | Your Professional Path | Votre Chemin Professionnel |
| **Money** | Coins | Emerald/Green | Abundance & Prosperity | Abondance & Prospérité |
| **Life Path** | Compass | Indigo/Purple | Direction & Purpose | Direction & Objectif |
| **Family** | Users | Teal/Cyan | Bonds & Belonging | Liens & Appartenance |
| **Birth Cards** | Sparkles | Violet/Cosmic | Your Soul's Blueprint | L'Empreinte de Votre Âme |

---

## Depth Options

### Regular Categories (5 depths)

| Cards | Label EN | Label FR | Visual | Credits |
|-------|----------|----------|--------|---------|
| 1 | Quick Insight | Aperçu Rapide | Single card | 1 |
| 3 | Past Present Future | Passé Présent Futur | 3 cards row | 3 |
| 5 | Deep Dive | Exploration Profonde | 5 cards row | 5 |
| 7 | Fortune's Arc | Arc du Destin | Horseshoe shape | 7 |
| 10 | Complete Picture | Tableau Complet | Celtic cross mini | 10 |

### Birth Cards (3 depths)

| Cards | Label EN | Label FR | Credits |
|-------|----------|----------|---------|
| 1 | Soul Card | Carte de l'Âme | 1 |
| 2 | Soul + Personality | Âme + Personnalité | 2 |
| 3 | Year Energy | Énergie de l'Année | 3 |

---

## Smart Default Layouts

For 3-card and 5-card depths, auto-select a sensible layout based on category:

| Category | 3-Card Default | 5-Card Default |
|----------|----------------|----------------|
| Love | You • Them • Connection | Love & Relationships |
| Career | Situation • Action • Outcome | Career & Purpose |
| Money | Situation • Action • Outcome | Alchemy |
| Life Path | Past • Present • Future | Authentic Self |
| Family | You • Them • Connection | Inner Child |

Layout picker shown as collapsed "Change layout" link for power users.

---

## Birth Cards Special Flow

### Interpretation Approach

| Depth | What's Static | What AI Does |
|-------|---------------|--------------|
| 1 card (Soul) | Pre-written meaning | Nothing - display static meaning |
| 2 cards | Both cards static | Ties the two together |
| 3 cards | All three static | Weaves all into unified portrait |

### Birth Date Entry Screen

```
┌─────────────────────────────────────────────────────────────────┐
│  ✦ BIRTH CARDS                                                  │
│  Your Soul's Blueprint                                          │
│─────────────────────────────────────────────────────────────────│
│                                                                 │
│  Enter your birth date to reveal your personal cards            │
│                                                                 │
│  ┌──────────────────────────────────────────┐                  │
│  │  Day [▼]   Month [▼]   Year [▼]         │                  │
│  └──────────────────────────────────────────┘                  │
│                                                                 │
│  ┌─ What you'll discover ──────────────────┐                   │
│  │  ✦ Soul Card - your life purpose        │                   │
│  │  ✦ Personality Card - your nature       │                   │
│  │  ✦ Year Card - 2026 energy theme        │                   │
│  └──────────────────────────────────────────┘                  │
│                                                                 │
│  [ Optional: Add a question about your cards ]                  │
│                                                                 │
│           Cost: X credits                                       │
│      [ Reveal Your Cards ]                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### "Go Deeper" Upsell

After viewing a reading, users can upgrade:

```
┌─────────────────────────────────────────────────────────────────┐
│  Your Soul Card: The Empress                                    │
│  [Static interpretation displayed]                              │
│─────────────────────────────────────────────────────────────────│
│  ✦ Want to go deeper?                                          │
│  ┌────────────────────┐  ┌────────────────────┐                │
│  │ + Personality Card │  │ + Full Portrait    │                │
│  │   +1 credit        │  │   +2 credits       │                │
│  └────────────────────┘  └────────────────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

---

## URL Structure

| Route | Purpose |
|-------|---------|
| `/reading` | Category Selector |
| `/reading/:category` | Deep-link to expanded category |
| `/reading/:category/:depth` | IntroPhase |
| `/reading/birth-cards/:depth` | Birth date entry |
| `/reading/:category/:depth/draw` | Drawing phase |
| `/reading/:category/:depth/reveal` | Reveal phase |

**No backwards compatibility** - old spread URLs removed entirely (site not yet in production).

---

## Internal Mapping

Category + Depth maps to existing SpreadTypes:

| Depth | SpreadType |
|-------|------------|
| 1 card | SpreadType.SINGLE |
| 3 cards | SpreadType.THREE_CARD |
| 5 cards | SpreadType.FIVE_CARD |
| 7 cards | SpreadType.HORSESHOE |
| 10 cards | SpreadType.CELTIC_CROSS |

---

## Mobile Responsiveness

| Screen | Layout | Expansion |
|--------|--------|-----------|
| Desktop (lg+) | 3 columns × 2 rows | Expands in place, others shrink |
| Tablet (md) | 2 columns × 3 rows | Same behavior |
| Mobile (sm) | 1 column × 6 rows | Expands, pushes others down |

---

## Files to Create

| File | Purpose |
|------|---------|
| `components/CategorySelector.tsx` | New category grid (replaces SpreadSelector) |
| `constants/categoryConfig.ts` | Category definitions, themes, default layouts |
| `components/reading/BirthCardEntry.tsx` | Birth date input screen |
| `constants/birthCardMeanings.ts` | Static Major Arcana meanings (22 cards) |
| `components/reading/BirthCardReading.tsx` | Birth card interpretation display |

## Files to Modify

| File | Changes |
|------|---------|
| `routes/index.tsx` | New route structure, remove old spread routes |
| `components/reading/phases/*IntroPhase.tsx` | Accept pre-selected category, simplify |
| `components/ActiveReading.tsx` | Handle new category-first flow |
| `types.ts` | Add ReadingCategory, BirthCardDepth types |

---

## Future Considerations

- Save birth date to user profile (with consent) for quick re-readings
- Year Card meaning updates annually (admin function or scheduled)
- Analytics on category popularity to inform future features
