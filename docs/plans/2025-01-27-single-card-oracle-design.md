# Single Card Oracle Redesign

**Date:** 2025-01-27
**Status:** Design Complete
**Type:** Feature Redesign

---

## Overview

Redesign the single card spread from a simple "answer" reading into a **daily oracle guidance** experience. The focus shifts from divination/advice to reflective awareness and empowerment.

### Core Principles
- Oracle-style daily guidance, not yes/no divination
- Reflective, not prescriptive ("notice this" vs "do this")
- Empowers users to reframe blame-based or closed questions
- Themed to user's chosen life area

---

## UX Flow

### 1. Category Selection

When user selects Single Card spread, they first choose a theme:

| Category | Purpose |
|----------|---------|
| General Guidance | Broad life awareness |
| Love & Relationships | Connection, dynamics, self in relationships |
| Career & Purpose | Direction, strengths, opportunities |
| Decision-Making | Clarity, factors, confidence |
| Healing & Personal Growth | Patterns, balance, inner work |

### 2. Question Selection

Based on category, a dropdown appears with 5 curated questions.

Below the dropdown, a "Write your own" text field with:
- Helper text: *"Open-ended questions work best. Try 'What can I learn from...' or 'What do I need to understand about...'"*
- Link to existing blog article on asking good questions

### 3. Interpretation Styles (Optional)

Four "go deeper" toggles — selecting **any combination** adds 1 credit total:
- Spiritual
- Numerology
- Elements
- Psycho-emotional

Classic interpretation is built into the base reading.

### 4. Pricing Display

- "1 credit" when no styles selected
- "2 credits" when any style(s) selected

### 5. Position Label

Card displays as **"Today's Guidance"** (replacing "The Answer")

---

## Question Bank

### General Guidance
- What do I most need to understand about this situation right now?
- What energy is surrounding this issue?
- What is being asked of me at this time?
- What am I not seeing clearly?
- What would support my highest good in this situation?

### Love & Relationships
- What is the deeper dynamic between me and this person?
- What can I learn from this connection?
- What role do I play in the current state of this relationship?
- What would help me move forward in a healthy way?
- What is this relationship teaching me about myself?

### Career & Purpose
- What direction is most aligned with me right now?
- What strengths should I be leaning into at work?
- What is blocking my progress, and how can I address it?
- What opportunities am I overlooking?
- What would success look like for me in this phase of my career?

### Decision-Making
- What are the key factors I should consider before deciding?
- What is the potential outcome if I choose this path?
- What fears or beliefs are influencing my choice?
- What would help me feel more confident in my decision?
- What is the long-term lesson connected to this choice?

### Healing & Personal Growth
- What needs healing or attention within me right now?
- What pattern am I being asked to release?
- What would help me feel more balanced and grounded?
- What inner strength can I draw on?
- How can I best support my own growth at this time?

---

## AI Interpretation Structure

### Base Reading (300-400 words, always present)

**1. The Card's Energy**
- What this card represents in tarot tradition
- Core symbolism, archetypes, and themes
- Interpreted as drawn (upright OR reversed, not both)

**2. Today's Guidance**
- Themed to the selected category
- How this card's energy applies to their question/intention
- What to be aware of, what themes may arise
- Reflective, not prescriptive

### Optional Style Sections (~100 words each)

**3. Spiritual Perspective** *(if selected)*
- Soul lessons, higher purpose, spiritual growth angle

**4. Numerological Insight** *(if selected)*
- Card's number meaning, cycles, timing themes

**5. Elemental Energy** *(if selected)*
- Fire/Water/Air/Earth qualities, working with that element

**6. Psycho-Emotional Reflection** *(if selected)*
- Inner patterns, emotional themes, psychological insight

### AI Reframing Behavior

If user writes a yes/no or blame-based custom question, the AI:
- Acknowledges their concern
- Gently offers a more empowering perspective
- Weaves the reframe naturally into guidance (no lecturing)

---

## Prompt Template

### PROMPT_TAROT_BASE_SINGLE

```
You are a mystical, wise, and empathetic Tarot Reader offering daily oracle guidance.

Task: Provide an insightful single card reading as daily guidance.
Language: {{language}}
Category: {{category}}

User's Intention: "{{question}}"

Card Drawn:
{{cardDescription}}

Important Guidelines:
- Interpret the card as drawn (upright or reversed, not both)
- This is reflective guidance, not predictive divination
- Offer awareness and insight, not prescriptive advice
- Theme your guidance to the user's chosen category ({{category}})
{{reframingGuidance}}

Structure your response with these sections:

1. **The Card's Energy** — Describe what this card represents: its core symbolism, archetypes, and themes as they appear in this orientation. Ground the seeker in the card's essence before applying it to their situation.

2. **Today's Guidance** — Connect the card's energy to their intention and chosen category. What themes might arise today? What should they be aware of or open to? Speak to their situation without telling them what to do. Let the card illuminate rather than instruct.

{{styleInstructions}}

IMPORTANT FORMATTING RULES:
- Write in flowing, natural prose paragraphs
- Use **bold** only for card name and section headings
- DO NOT use tables, grids, or bullet points
- DO NOT use emojis or icons
- Write as a mystical oracle would speak, not as an AI assistant

Tone: Mystical, reflective, warm, and gently empowering.
```

### Style Section Templates

```
3. **Spiritual Perspective** — Explore the soul lessons and higher purpose this card offers. What spiritual growth or awakening does it point toward?

4. **Numerological Insight** — The number {{cardNumber}} carries meaning. Explore cycles, timing, and the numerological significance present in this card.

5. **Elemental Energy** — This card carries {{element}} energy. How can the seeker work with this elemental quality today?

6. **Psycho-Emotional Reflection** — What inner patterns, emotional themes, or psychological insights does this card reveal? What might be surfacing from within?
```

### Reframing Guidance Insert

```
If the user's question appears to be yes/no or blame-focused, gently acknowledge their concern while offering a more empowering perspective. Do not lecture — simply weave a reframe naturally into your guidance.
```

---

## Technical Implementation

### Frontend Changes

| File | Change |
|------|--------|
| `constants.ts` | Update single card position: "The Answer" → "Today's Guidance" |
| `constants.ts` or new file | Add question bank data (categories + questions) |
| Reading flow components | Add category selector + question dropdown for single card |
| Reading flow components | Show "+1 credit" when styles selected, update total display |

### Backend Changes

| File | Change |
|------|--------|
| `server/src/shared/constants/prompts.ts` | Create `PROMPT_TAROT_BASE_SINGLE` |
| `server/src/shared/constants/prompts.ts` | Add style section templates for single card |
| `server/src/services/promptService.ts` | Route single card spreads to new prompt |
| `server/src/services/promptService.ts` | Pass category, build style sections dynamically |
| `server/src/routes/ai.ts` | Accept category parameter, calculate tokens based on styles |

### Prompt Service Logic

```typescript
if (spreadType === 'single') {
  // Use dedicated single card prompt
  basePrompt = await getPrompt('PROMPT_TAROT_BASE_SINGLE');

  // Include category context
  variables.category = params.category;

  // Build style sections only if selected
  if (styles.length > 0) {
    variables.styleInstructions = buildStyleSections(styles, cardData);
  }

  // Set tokens: 800 base + 200 per style
  maxTokens = 800 + (styles.length * 200);
}
```

### Pricing Logic

```typescript
// In payment/credit calculation
const singleCardCost = styles.length > 0 ? 2 : 1;
```

---

## Files to Modify

1. `constants.ts` — Position meaning, question bank
2. `server/src/shared/constants/prompts.ts` — New single card prompt
3. `server/src/services/promptService.ts` — Routing logic
4. `server/src/routes/ai.ts` — Category parameter, token calculation
5. Frontend reading flow components — Category/question UI, pricing display

---

## Out of Scope

- Changes to other spread types (3-card, Love, Career, etc.)
- Mobile-specific UI
- New blog content (existing article will be linked)
