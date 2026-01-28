# Five-Card Spread Redesign

## Overview

Transform the 5-card spread from two separate spreads (Love, Career) into a unified "5-Card Spread" with category selection, layout options, and curated questions. This aligns with the enhanced single-card and 3-card reading flows.

## Goals

1. Create a cohesive "deep inner work" identity for 5-card readings
2. Offer 5 thematic categories with 2 layout options each
3. Provide gentle, empowering curated questions per category
4. Maintain consistency with the single-card and 3-card UX patterns

## Category Structure

| Category | Tagline | Layout 1 | Layout 2 |
|----------|---------|----------|----------|
| Self-Awareness | Exploring what lies beneath the surface | Iceberg | Mirror |
| Gentle Healing | Nurturing your heart and inner child | Inner Child | Safe Space |
| Know Yourself | Discovering who you truly are | Authentic Self | Values |
| Personal Growth | Embracing change and new beginnings | Alchemy | Seasons |
| Relationships and Career | Navigating love and work | Love & Relationships | Career & Purpose |

## Layout Position Meanings

### Self-Awareness

**The Iceberg**
1. What's visible (conscious)
2. What's beneath (unconscious)
3. Root cause
4. How it serves you
5. Path to integration

**The Mirror**
1. How you see yourself
2. How others see you
3. What you refuse to see
4. The truth beneath both
5. Acceptance message

### Gentle Healing

**Inner Child**
1. Your inner child now
2. What they need
3. What wounded them
4. How to nurture them
5. The gift they hold

**Safe Space**
1. Where you feel unsafe
2. What safety means to you
3. What blocks you from feeling safe
4. How to create internal safety
5. Your protector energy

### Know Yourself

**Authentic Self**
1. Who you were taught to be
2. Who you pretend to be
3. Who you fear being
4. Who you truly are
5. How to embody your truth

**Values**
1. What you say you value
2. What your actions reveal
3. A value you've abandoned
4. A value calling to you
5. Alignment message

### Personal Growth

**The Alchemy**
1. The lead (what feels heavy)
2. The fire (the transformation needed)
3. The process (how change happens)
4. The gold (what you're becoming)
5. The philosopher's stone (your inner catalyst)

**The Seasons**
1. What needs to die (autumn)
2. What needs rest (winter)
3. What's ready to sprout (spring)
4. What's ready to bloom (summer)
5. The cycle's wisdom

### Relationships and Career

**Love & Relationships**
1. Your Heart
2. Their Heart
3. The Connection
4. Challenges
5. Potential

**Career & Purpose**
1. Current Position
2. Obstacles
3. Hidden Factors
4. Action to Take
5. Outcome

## Curated Questions

### Self-Awareness
1. What recurring patterns in my life are inviting my attention right now?
2. What truth about myself am I ready to acknowledge, even if I haven't fully seen it before?
3. How can I deepen my relationship with myself through greater honesty and self-reflection?

### Gentle Healing
1. Which part of me is quietly asking for tenderness, patience, and care?
2. What does my heart truly need in order to feel safe enough to heal?
3. How can I offer myself the same compassion, understanding, and warmth I give to those I love?

### Know Yourself
1. Where in my life am I being called to align my actions more closely with my core values?
2. What aspect of my truest self is asking to be seen, accepted, or expressed?
3. How can I honour my authentic self more fully in my everyday choices and routines?

### Personal Growth
1. What subtle transformation is already unfolding within me or around me?
2. How can I surrender more trust to the process of change I am moving through?
3. What is ready to shift or evolve within me?

### Relationships and Career

**Navigating Relationships** (shown when Love & Relationships layout selected):
1. What is this relationship (or my relationships) revealing to me about my needs, patterns, and expectations?
2. Where am I being invited to communicate more honestly, openly, or courageously with others?
3. How can I show up in my relationships in a way that feels authentic, respectful, and emotionally aligned?

**Navigating Career** (shown when Career & Purpose layout selected):
1. What opportunities, skills, or strengths should I be focusing on right now to move my career forward?
2. What strategic step would create the most progress or momentum in my professional life at this time?
3. What do I need to see clearly about my current role or career path in order to make a confident next move?

## User Flow

1. User selects "5-Card Spread" from spread selector
2. **FiveCardIntroPhase** displays:
   - Category selection (5 categories with icons and taglines)
   - Layout selection (2 options per category, shown after category selected)
   - Question selection (3 curated + custom option, layout-specific for Relationships and Career)
3. User clicks "Begin Reading" to proceed to shuffle phase
4. Standard reading flow continues (shuffle, draw, reveal, interpretation)

## UI Components

### New Components
- `FiveCardIntroPhase.tsx` - Main intro phase component (mirrors ThreeCardIntroPhase)
- `FiveCardCategorySelector.tsx` - Category selection grid
- `FiveCardLayoutSelector.tsx` - Layout option selector
- `FiveCardQuestionSelector.tsx` - Question selection with curated options

### Constants
- `constants/fiveCardLayouts.ts` - Categories, layouts, positions, questions

### Modified Components
- `ActiveReading.tsx` - Add 5-card intro phase handling
- `SpreadSelector.tsx` - Update to show single "5-Card Spread" option
- `constants.ts` - Remove separate Love/Career spreads, add unified 5-card spread

## Theming

Each category should have a distinct visual identity:

| Category | Suggested Color | Icon |
|----------|-----------------|------|
| Self-Awareness | Deep blue/indigo | Eye or Layers |
| Gentle Healing | Soft rose/pink | Heart or Feather |
| Know Yourself | Warm amber/gold | Compass or Star |
| Personal Growth | Fresh green/teal | Sprout or Butterfly |
| Relationships and Career | Purple/violet | Users or Briefcase |

## Backend Changes

### Prompt Service
- Add spread guidance for each new layout (10 total)
- Layout-specific position meanings passed to AI

### API
- Accept `layoutId` for 5-card spreads (same pattern as 3-card)
- Use layout-specific positions in prompt assembly

## Migration Notes

- Current Love and Career spreads will be consolidated into the unified 5-card spread
- Existing reading history remains valid (spread type stays as 'love' or 'career')
- New readings will use the new layout IDs

## Cost

5-card spread cost remains at **5 credits** (same as current Love/Career spreads).

## Future Considerations

- Reserve complex spreads (Archetypal Self, Phoenix, Soul Contract) for 7-card and 10-card
- Consider adding more layouts to popular categories based on usage data
- Style options (Spiritual, Elemental, etc.) apply to 5-card spreads as with other spreads
