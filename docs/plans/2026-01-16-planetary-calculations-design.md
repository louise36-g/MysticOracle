# Planetary Calculations for Accurate Horoscopes - Design Document

**Date**: 2026-01-16
**Status**: Approved for Implementation
**Author**: Design session with user

---

## Overview

Enhance horoscope generation with real astronomical data by integrating local planetary position calculations. Instead of AI inventing planetary positions, we calculate actual celestial positions using astronomical algorithms and inject them into the AI prompt.

---

## Problem Statement

Current horoscope generation prompts the AI to "reference specific transits and aspects," but the AI has no real astronomical data. It invents planetary positions, which may be astronomically incorrect.

---

## Solution

Use `astronomy-engine` npm library to calculate real planetary positions locally (no external API), then inject this data into the existing AI prompt.

---

## Architecture

### Current Flow
```
User Request → Cache Check → AI Generation → Cache & Return
```

### Enhanced Flow
```
User Request → Cache Check →
  ↓ (cache miss)
Calculate Planetary Positions (5-10ms, local) →
Enhance AI Prompt with Real Data →
AI Generation → Cache & Return
```

### Key Principles
1. **No external dependencies** - Pure local calculations using astronomical algorithms
2. **Fast performance** - 5-10ms calculation time per horoscope
3. **Single caching layer** - Horoscopes cached per sign/language/date (existing system)
4. **Fail explicitly** - If calculations fail, show error (don't silently fallback)
5. **Minimal changes** - Enhance existing flow, don't replace it

---

## Technology Choice

**Library**: `astronomy-engine` by Don Cross

**Why This Library**:
- Uses VSOP87 (industry-standard orbital mechanics formulas)
- Pure TypeScript/JavaScript (no native bindings, cross-platform)
- Accurate to within 1 arcminute for planets
- ~80KB package size
- No internet connection required
- Calculations from first principles, not lookup tables

**Accuracy**:
- Planets: ±1 arcminute (sufficient for astrology)
- Moon: ±10 arcseconds
- Same accuracy as professional planetarium software

---

## Data Structure

### Planetary Data Format

```typescript
interface PlanetaryData {
  date: Date;
  positions: {
    sun: { longitude: number; sign: string };
    moon: { longitude: number; sign: string; phase: string; illumination: number };
    mercury: { longitude: number; sign: string; retrograde: boolean };
    venus: { longitude: number; sign: string; retrograde: boolean };
    mars: { longitude: number; sign: string; retrograde: boolean };
    jupiter: { longitude: number; sign: string; retrograde: boolean };
    saturn: { longitude: number; sign: string; retrograde: boolean };
  };
  aspects: Array<{
    planet1: string;
    planet2: string;
    type: 'conjunction' | 'opposition' | 'trine' | 'square' | 'sextile';
    orb: number;
  }>;
}
```

### Formatted Output for AI Prompt

```
Current Planetary Positions:
- Sun at 25° Capricorn
- Moon at 12° Leo (Waxing Gibbous, 87% illuminated)
- Mercury at 18° Sagittarius (Retrograde)
- Venus at 8° Aquarius
- Mars at 22° Cancer
- Jupiter at 14° Gemini
- Saturn at 6° Pisces

Major Aspects:
- Sun square Mars (3° orb) - tension between will and action
- Venus trine Jupiter (2° orb) - harmony in expansion and relationships
```

---

## Prompt Integration

### Existing Prompt Variables

Current (line 157 of `server/src/shared/constants/prompts.ts`):
```typescript
variables: ['language', 'sign', 'today']
```

### Enhanced Variables

```typescript
variables: ['language', 'sign', 'today', 'planetaryData']
```

### Injection Point

Insert planetary data after "Today's Date" in `PROMPT_HOROSCOPE`:

```
Today's Date: {{today}}

Current Planetary Positions:
{{planetaryData}}

Structure your horoscope with these sections...
```

---

## Components

### 1. PlanetaryCalculationService

**Location**: `server/src/services/planetaryCalculationService.ts`

**Responsibilities**:
- Calculate planetary positions for a given date
- Determine zodiac signs from ecliptic longitude
- Detect retrograde motion
- Calculate moon phase and illumination
- Calculate major aspects between planets
- Format data for AI prompt injection
- Handle calculation errors gracefully

**Key Methods**:
```typescript
calculatePlanetaryPositions(date: Date): Promise<PlanetaryData>
formatForPrompt(data: PlanetaryData): string
```

### 2. Enhanced generateHoroscope() Function

**Location**: `server/src/routes/horoscopes.ts`

**Changes**:
```typescript
async function generateHoroscope(sign: string, language: 'en' | 'fr'): Promise<string> {
  // Calculate planetary positions
  const planetaryData = await calculatePlanetaryPositions(new Date());
  const formattedData = formatForPrompt(planetaryData);

  // Get prompt with planetary data
  const prompt = await getHoroscopePrompt({
    sign,
    today,
    language,
    planetaryData: formattedData, // NEW
  });

  // Generate with AI
  return openRouterService.generateHoroscope(prompt, {
    temperature: 0.8,
    maxTokens: 1000,
  });
}
```

### 3. Prompt Definition Update

**Location**: `server/src/shared/constants/prompts.ts`

**Changes**:
- Add `planetaryData` to variables array
- Insert `{{planetaryData}}` placeholder in prompt template

---

## Error Handling

### When Calculations Fail

**Response**:
```typescript
{
  error: "The stars appear a bit clouded right now - we're having trouble reading the planetary positions. Please try again in a few moments. We've been notified and are working to fix the issue.",
  code: "PLANETARY_CALCULATION_FAILED",
  retryable: true
}
```

**Logging**:
- Log all calculation failures with stack traces
- Track which planets/calculations failed
- Include date/time context for debugging
- Alert on repeated failures (future enhancement)

**No Silent Fallbacks**:
- Do NOT generate horoscopes without planetary data
- Fail explicitly with user-friendly error
- Better to be honest than provide inaccurate readings

### Error Scenarios

1. **Library calculation throws** → Return error response
2. **Invalid date input** → Validate and return error
3. **Partial calculation failure** → Return error (all-or-nothing)

---

## Testing Strategy

### Unit Tests

1. **Planetary Position Accuracy**
   - Test calculations for known dates
   - Compare against published ephemeris data
   - Verify zodiac sign determinations

2. **Retrograde Detection**
   - Test known retrograde periods (e.g., Mercury retrograde dates)
   - Verify retrograde flag accuracy

3. **Aspect Calculations**
   - Test conjunction (0° ±8°)
   - Test opposition (180° ±8°)
   - Test trine (120° ±8°)
   - Test square (90° ±8°)
   - Test sextile (60° ±6°)

4. **Moon Phase Calculations**
   - Test new moon, full moon, quarters
   - Verify illumination percentages

### Integration Tests

1. **Full Horoscope Generation**
   - Generate horoscopes for all 12 signs
   - Verify planetary data appears in prompts
   - Verify AI uses the data in interpretations

2. **Error Handling**
   - Test behavior when calculations fail
   - Verify error messages are returned correctly
   - Verify no horoscope is generated on error

3. **Caching Behavior**
   - Verify horoscopes cache correctly with planetary data
   - Verify midnight reset still works

### Manual Verification

1. **Cross-reference with astro.com**
   - Generate horoscope for today
   - Compare planetary positions with astro.com
   - Verify accuracy within expected tolerances

2. **Astrological Validity**
   - Review generated horoscopes
   - Ensure planetary data makes astrological sense
   - Verify AI interpretations use the real data

---

## Implementation Phases

### Phase 1: Core Calculations
- Install `astronomy-engine`
- Create `PlanetaryCalculationService`
- Implement planetary position calculations
- Add unit tests

### Phase 2: Prompt Integration
- Update prompt definition with `planetaryData` variable
- Enhance `generateHoroscope()` function
- Format planetary data for AI consumption
- Add integration tests

### Phase 3: Error Handling
- Implement error responses
- Add error logging
- Test failure scenarios

### Phase 4: Verification & Polish
- Manual testing with all 12 signs
- Cross-reference with known sources
- Code review and cleanup

---

## Success Criteria

- ✅ Horoscopes reference real planetary positions
- ✅ Calculations accurate to within 1° (arcminute level)
- ✅ All 12 zodiac signs generate correctly
- ✅ Retrograde planets correctly identified
- ✅ Moon phases accurate
- ✅ Major aspects calculated correctly
- ✅ Errors fail gracefully with kind messages
- ✅ No performance degradation (still <1s total generation time)
- ✅ Existing caching and midnight reset work unchanged

---

## Future Enhancements (Out of Scope)

- More celestial bodies (Uranus, Neptune, Pluto, asteroids)
- Minor aspects (semisextile, quincunx, etc.)
- House calculations (requires user location)
- Transit-to-natal comparisons (requires user birth data)
- Error analytics dashboard
- Planetary position visualization
