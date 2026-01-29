# Celtic Cross 10-Card Spread Design

> **For Claude:** Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Add the Celtic Cross spread - the deepest, most comprehensive tarot reading (10 cards, 10 credits)

**Architecture:** One universal 10-position layout shared across 5 thematic categories. Categories provide focused questions but all use the same card positions and meanings.

**Tech Stack:** React, TypeScript, Framer Motion (animations), Tailwind CSS

---

## Core Decisions

| Aspect | Decision |
|--------|----------|
| **Structure** | One universal 10-position layout, categories provide thematic focus |
| **Categories** | Love, Career, Money, Life Path, Family (matches Horseshoe) |
| **Questions** | 3-4 introspective CNV-friendly questions per category |
| **Positions** | Modern accessible language |
| **Visual** | Traditional cross + staff arrangement, Card 2 crosses Card 1 |
| **Reveal order** | Traditional 1→10, building the narrative |
| **Cost** | 10 credits (existing) |

---

## Data Structure

### Types

```typescript
export type CelticCrossCategory =
  | 'love'
  | 'career'
  | 'money'
  | 'life_path'
  | 'family';

export type CelticCrossLayoutId = 'celtic_cross';
```

### The 10 Positions

| # | English | French |
|---|---------|--------|
| 1 | The heart of the matter | Le cœur du sujet |
| 2 | What's blocking you | Ce qui vous bloque |
| 3 | What's beneath (unconscious) | Ce qui est en dessous (inconscient) |
| 4 | What's behind (past) | Ce qui est derrière (passé) |
| 5 | What's above (conscious goal) | Ce qui est au-dessus (objectif conscient) |
| 6 | What's ahead (near future) | Ce qui est devant (futur proche) |
| 7 | How you see yourself | Comment vous vous voyez |
| 8 | How others see you | Comment les autres vous voient |
| 9 | What you need to know | Ce que vous devez savoir |
| 10 | Where this leads | Où cela mène |

---

## Categories Configuration

### Love & Relationships
- **Icon:** Heart
- **Color:** rose
- **Tagline EN:** Deep insight into matters of the heart
- **Tagline FR:** Vision profonde des affaires du cœur

### Career & Purpose
- **Icon:** Briefcase
- **Color:** amber
- **Tagline EN:** Clarity on your professional path
- **Tagline FR:** Clarté sur votre chemin professionnel

### Money & Abundance
- **Icon:** Coins
- **Color:** emerald
- **Tagline EN:** Understanding your relationship with prosperity
- **Tagline FR:** Comprendre votre relation avec la prospérité

### Life Path
- **Icon:** Compass
- **Color:** indigo
- **Tagline EN:** Navigate major crossroads and transitions
- **Tagline FR:** Naviguez les carrefours et transitions majeurs

### Family & Community
- **Icon:** Users
- **Color:** teal
- **Tagline EN:** Insight into bonds and belonging
- **Tagline FR:** Vision des liens et de l'appartenance

---

## Suggested Questions

### Love (4 questions)
1. "What do I need to understand about where this relationship is heading?"
2. "What patterns in my heart are shaping how I connect with others?"
3. "What would help me feel more at peace about this situation with [person]?"
4. "What's asking for my attention in how I give and receive love?"

### Career (4 questions)
1. "What do I need to see clearly about my professional path right now?"
2. "What's really driving my feelings of restlessness or dissatisfaction at work?"
3. "What would help me feel more aligned with my sense of purpose?"
4. "What am I not seeing about this career decision I'm facing?"

### Money (4 questions)
1. "What do I need to understand about my relationship with money and security?"
2. "What beliefs or patterns are influencing my financial situation?"
3. "What would help me feel more grounded about my financial future?"
4. "What's asking for attention in how I relate to abundance?"

### Life Path (4 questions)
1. "What do I need to understand about this crossroads I'm facing?"
2. "What's really at the heart of this major decision?"
3. "What would bring me clarity about the direction my life is taking?"
4. "What am I being called to see about my journey right now?"

### Family (4 questions)
1. "What do I need to understand about the dynamics in my family?"
2. "What patterns are shaping my role within my family or community?"
3. "What would help me feel more at peace in this relationship with [family member]?"
4. "What's asking for healing in my sense of belonging?"

---

## Visual Layout

Traditional cross + staff arrangement:

```
           [5]
    [4]  [1][2]  [6]         [10]
           [3]                [9]
                              [8]
                              [7]
```

### Key Visual Details

- **Card 1 & 2 overlap:** Card 2 (blocking/crossing) sits horizontally rotated 90° across Card 1
- **Cross portion:** Cards 1-6 form the cross (roughly square)
- **Staff portion:** Cards 7-10 stack vertically on the right
- **Reveal animation:** Cards appear in order 1→10 with existing flip animation
- **Responsive:** Layout scales down on mobile, maintains iconic shape

---

## Custom Question Helper Text

**English:** "The Celtic Cross excels at complex, layered questions. Share what's weighing on you - the cards will illuminate all dimensions."

**French:** "La Croix Celtique excelle pour les questions complexes et nuancées. Partagez ce qui vous préoccupe - les cartes illumineront toutes les dimensions."

---

## Files to Create

| File | Purpose |
|------|---------|
| `constants/celticCrossLayouts.ts` | Types, categories, layout, questions |
| `components/reading/phases/CelticCrossIntroPhase.tsx` | Intro phase with SpreadIntroSelector |
| `components/reading/CelticCrossDisplay.tsx` | Visual cross + staff card arrangement |

## Files to Modify

| File | Changes |
|------|---------|
| `components/reading/phases/SpreadIntroSelector.tsx` | Add celtic cross imports and case |
| `components/ActiveReading.tsx` | Add celtic cross state, handlers, render case |

---

## Future Context

This Celtic Cross implementation completes the spread lineup and prepares for the planned UX restructure where reading selection becomes category-first (Love → choose spread depth) rather than spread-first.
