# Three Card Intro Phase Design

> **For Claude:** Use superpowers:writing-plans to create an implementation plan from this design.

**Goal:** Add a guided intro phase for 3-card readings that mirrors the single card experience with category selection, layout choice, and curated questions.

**Architecture:** New ThreeCardIntroPhase component with category-to-layout mapping. Decision and Healing categories offer two layout options via radio buttons. Questions are reflective and energy-focused to support personal development.

---

## Categories & Layouts

| Category | Layout(s) | Position 1 | Position 2 | Position 3 |
|----------|-----------|------------|------------|------------|
| General | past_present_future | Past | Present | Future |
| Love | you_them_connection | You | Them | The Connection |
| Career | situation_action_outcome | Situation | Action | Outcome |
| Decision | option_a_b_guidance | Option A | Option B | Guidance |
| Decision | situation_obstacle_path | Situation | Obstacle | Path Forward |
| Healing | mind_body_spirit | Mind | Body | Spirit |
| Healing | challenge_support_growth | Challenge | Support | Growth |

**Layout selection:**
- General, Love, Career: Fixed layout (no user choice needed)
- Decision, Healing: Radio buttons with visual showing the 3 positions

---

## Curated Questions

### General Guidance
1. What do I most need to understand about this situation right now?
2. What energy is surrounding this issue?
3. What is being asked of me at this time?
4. What am I not seeing clearly?
5. What would support my highest good in this situation?

### Love & Relationships
1. What is the deeper dynamic between me and this person?
2. What can I learn from this connection?
3. What role do I play in the current state of this relationship?
4. What would help me move forward in a healthy way?
5. What is this relationship teaching me about myself?

### Career & Purpose
1. What direction is most aligned with me right now?
2. What strengths should I be leaning into at work?
3. What is blocking my progress, and how can I address it?
4. What opportunities am I overlooking?
5. What would success look like for me in this phase of my career?

### Decision-Making (both layouts)
1. What are the key factors I should consider before deciding?
2. What is the potential outcome if I choose this path?
3. What fears or beliefs are influencing my choice?
4. What would help me feel more confident in my decision?
5. What is the long-term lesson connected to this choice?

### Healing & Growth (both layouts)
1. What needs healing or attention within me right now?
2. What pattern am I being asked to release?
3. What would help me feel more balanced and grounded?
4. What inner strength can I draw on?
5. How can I best support my own growth at this time?

---

## UI Flow

```
1. User selects "Three Card Spread" from spread selector
                    ↓
2. ThreeCardIntroPhase loads
                    ↓
3. User sees category chips (General, Love, Career, Decision, Healing)
                    ↓
4. User taps a category
                    ↓
   ┌─────────────────────────────────────────────────┐
   │ IF General, Love, or Career:                    │
   │   → Show dropdown with 5 questions              │
   │   → Layout is fixed (shown as subtle label)     │
   │                                                 │
   │ IF Decision or Healing:                         │
   │   → Show layout radio buttons with visual       │
   │     (3 circles with position labels)            │
   │   → Then show dropdown with 5 questions         │
   └─────────────────────────────────────────────────┘
                    ↓
5. User selects question (or toggles "Write my own")
                    ↓
6. Optional: Advanced options toggle (interpretation styles)
                    ↓
7. "Shuffle the Deck" button becomes active
                    ↓
8. User proceeds to shuffle → draw → reading
```

---

## Layout-Specific Prompt Guidance

These texts are inserted into the AI prompt to explain how to interpret each position.

### Past → Present → Future (General)
> This Past-Present-Future spread reveals the timeline of your situation. The first card shows influences from your past that have shaped where you are. The second card reflects your current circumstances and energy. The third card illuminates the direction you're heading if you continue on this path.

### You → Them → The Connection (Love)
> This relationship spread explores the dynamic between two people. The first card reflects your energy, feelings, and role in this connection. The second card reveals the other person's energy and perspective. The third card shows the nature of the bond itself—what exists between you.

### Situation → Action → Outcome (Career)
> This career spread provides practical guidance. The first card shows your current professional situation and its energy. The second card suggests what action or approach is called for. The third card reveals the likely outcome of taking that approach.

### Option A → Option B → Guidance (Decision)
> This decision spread illuminates two paths. The first card shows the energy and potential of one option. The second card shows the energy and potential of the other option. The third card offers guidance on what to consider as you choose.

### Situation → Obstacle → Path Forward (Decision)
> This clarity spread helps when you feel stuck. The first card reveals the true nature of your situation. The second card shows what's blocking you or creating confusion. The third card illuminates how to move forward with clarity.

### Mind → Body → Spirit (Healing)
> This holistic spread explores your whole being. The first card reveals what's happening in your thoughts and mental state. The second card shows what your physical self or material circumstances need. The third card illuminates your spiritual state and soul lessons.

### Challenge → Support → Growth (Healing)
> This healing spread guides your inner work. The first card acknowledges what you're facing or struggling with. The second card reveals what can support and comfort you through this. The third card shows the growth and wisdom that can emerge from this experience.

---

## Data Structure

### Request to Backend

```typescript
{
  spread: {
    id: 'three_card',
    positions: 3,
    positionMeaningsEn: ['Mind', 'Body', 'Spirit'],  // Dynamic based on layout
    positionMeaningsFr: ['Esprit', 'Corps', 'Âme'],
  },
  category: 'healing',
  layoutId: 'mind_body_spirit',
  question: "What needs healing or attention within me right now?",
  cards: [
    { card: { nameEn: 'The Tower', ... }, isReversed: false },
    { card: { nameEn: 'Ten of Cups', ... }, isReversed: true },
    { card: { nameEn: 'The Star', ... }, isReversed: false },
  ],
  language: 'en',
  style: ['spiritual'],
}
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `constants/threeCardLayouts.ts` | Create | Categories, layouts, questions, French translations |
| `components/reading/ThreeCardIntroPhase.tsx` | Create | Main intro phase component |
| `components/reading/LayoutSelector.tsx` | Create | Radio buttons with visual card positions |
| `components/ActiveReading.tsx` | Modify | Route to ThreeCardIntroPhase for 3-card spread |
| `server/src/shared/constants/prompts.ts` | Modify | Add 7 layout guidance texts |
| `server/src/routes/ai.ts` | Modify | Use dynamic layout in prompt building |

---

## Cost

Remains **3 credits** for all 3-card readings (no change to pricing).

---

## Design Principles

- **Reflective questions:** Focus on energy, understanding, and self-awareness—not fortune-telling
- **Mirror single card UX:** Familiar flow for users who've done single card readings
- **Minimal friction:** Layout choice only when it adds value (Decision, Healing)
- **Clear visual feedback:** Radio buttons show card positions before selection
