# Daily Quote Feature Design

## Overview

Replace the "Oracle" category on the homepage with a "Thought for Today" daily inspirational quote feature. The quote displays directly on the card (no click interaction), changes daily, and is synchronized so all users see the same quote on the same day.

## Design Decisions

| Decision | Choice | Reasoning |
|----------|--------|-----------|
| Display style | Full card takeover | Differentiates from clickable features, gives quote space to breathe |
| Quote selection | Day-of-year synchronized | Creates community experience, simple calculation, no database needed |
| Storage | Static TypeScript file | No API calls, instant loading, easy to maintain |
| Interaction | Non-clickable | It's daily inspiration, not an interactive feature |

## Data Structure

```typescript
// constants/dailyQuotes.ts
export interface DailyQuote {
  id: number;
  textEn: string;
  textFr: string;
  author: string;
}

export const DAILY_QUOTES: DailyQuote[] = [
  // 365 quotes
];

export function getTodaysQuote(): DailyQuote {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const index = (dayOfYear - 1) % DAILY_QUOTES.length;
  return DAILY_QUOTES[index];
}
```

## Component Design

```typescript
// components/DailyQuoteCard.tsx
interface DailyQuoteCardProps {
  className?: string;
}

const DailyQuoteCard: React.FC<DailyQuoteCardProps> = ({ className }) => {
  const { language } = useApp();
  const quote = getTodaysQuote();

  return (
    <div className="bg-slate-900/40 p-6 rounded-xl border border-white/10">
      {/* Label */}
      <span className="text-xs text-amber-400 uppercase tracking-wider">
        {language === 'en' ? 'Thought for Today' : 'Pensée du Jour'}
      </span>

      {/* Quote */}
      <blockquote className="text-lg text-slate-200 italic leading-relaxed">
        "{language === 'en' ? quote.textEn : quote.textFr}"
      </blockquote>

      {/* Author */}
      <cite className="text-sm text-purple-300">
        — {quote.author}
      </cite>
    </div>
  );
};
```

**Visual Styling:**
- Same card dimensions as Tarot/Horoscope cards
- No hover lift effect (not clickable)
- Amber accent for label
- Italic quote text
- Purple author name

## File Changes

### New Files
| File | Purpose |
|------|---------|
| `constants/dailyQuotes.ts` | 365 quotes + getTodaysQuote() function |
| `components/DailyQuoteCard.tsx` | Quote display component |

### Modified Files
| File | Change |
|------|--------|
| `components/ReadingModeSelector.tsx` | Remove Oracle from readingModes array, render DailyQuoteCard as third grid item |
| `components/HomePage.tsx` | Remove Oracle placeholder section (lines 109-114) |

## Implementation Steps

1. Create `constants/dailyQuotes.ts` with all 365 quotes and helper function
2. Create `components/DailyQuoteCard.tsx` component
3. Update `ReadingModeSelector.tsx` to remove Oracle and add DailyQuoteCard
4. Update `HomePage.tsx` to remove Oracle placeholder
5. Test quote displays correctly in both languages
6. Verify quote changes at midnight (day boundary)

## No Backend Changes Required

Everything is client-side static data.
