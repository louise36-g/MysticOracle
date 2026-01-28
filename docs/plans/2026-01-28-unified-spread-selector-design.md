# Unified Spread Selector Design

> **For Claude:** Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Create an accordion-style category/layout selector that shows card positions, applied consistently across single, 3-card, and 5-card spreads.

**Key UX Change:** Custom question input is FIRST and prominent; premade questions are backup suggestions below.

---

## Architecture

```
SpreadIntroSelector (unified component)
├── AccordionCategory (expandable rows)
│   └── LayoutCard (shows numbered positions)
├── QuestionInput (prominent custom input FIRST)
└── SuggestedQuestions (premade as backup)
```

---

## Tasks

### Task 1: Create singleCardLayouts.ts

**File:** `constants/singleCardLayouts.ts`

Define 5 categories with 1 layout each for single card readings:
- Daily Guidance → "Card of the Day" (General message)
- Love → "Heart's Message" (What your heart needs)
- Career → "Professional Insight" (Work guidance)
- Decision → "Clarity Card" (Light on your choice)
- Self-Reflection → "Mirror Card" (Inner reflection)

Follow same pattern as threeCardLayouts.ts and fiveCardLayouts.ts.

### Task 2: Create SpreadIntroSelector component

**File:** `components/reading/phases/SpreadIntroSelector.tsx`

Unified accordion component with:
- Props: `spreadType`, `language`, `onComplete(layoutId, question)`
- Accordion categories that expand to show layouts
- Each layout shows numbered card positions
- Question section: custom input FIRST (prominent), suggested questions below

### Task 3: Update ThreeCardIntroPhase to use SpreadIntroSelector

**File:** `components/reading/phases/ThreeCardIntroPhase.tsx`

Replace current implementation with SpreadIntroSelector.

### Task 4: Update FiveCardIntroPhase to use SpreadIntroSelector

**File:** `components/reading/phases/FiveCardIntroPhase.tsx`

Replace current multi-step flow with SpreadIntroSelector.

### Task 5: Create SingleCardIntroPhase

**File:** `components/reading/phases/SingleCardIntroPhase.tsx`

New intro phase for single card using SpreadIntroSelector.

### Task 6: Wire SingleCardIntroPhase into ActiveReading

**File:** `components/ActiveReading.tsx`

Add intro phase for single card spread, matching 3-card and 5-card flow.

---

## Visual Reference

```
┌─────────────────────────────────────────┐
│ 👁 Self-Awareness                    ▼  │ ← Expanded
├─────────────────────────────────────────┤
│   ┌─ The Iceberg ─────────────────────┐ │
│   │ 1. What's visible                 │ │
│   │ 2. What's beneath the surface     │ │
│   │ 3. Root cause                     │ │
│   │ 4. How it serves you              │ │
│   │ 5. Path to integration            │ │
│   └───────────────────────────────────┘ │
│   ┌─ The Mirror ──────────────────────┐ │
│   │ 1. How you see yourself           │ │
│   │ 2. How others see you             │ │
│   │ 3. What you refuse to see         │ │
│   │ 4. The truth beneath              │ │
│   │ 5. Acceptance message             │ │
│   └───────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ 💕 Gentle Healing                    ▶  │ ← Collapsed
└─────────────────────────────────────────┘

After layout selection:

┌─────────────────────────────────────────┐
│ ✨ Your Question                        │
│ ┌─────────────────────────────────────┐ │
│ │ What do I need to understand...     │ │  ← Prominent input
│ └─────────────────────────────────────┘ │
│                                         │
│ Need inspiration?                       │
│ • What patterns are inviting attention? │  ← Suggested questions
│ • What truth am I ready to acknowledge? │
│ • How can I deepen self-honesty?        │
└─────────────────────────────────────────┘
```
