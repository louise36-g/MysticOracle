# Buy Credits Button & Quick-Buy Feature Design

**Date:** 2026-02-08
**Status:** Approved

## Overview

Improve credit purchase discoverability and flexibility by:
1. Adding a visible "Buy Credits" button in the header (separate from balance display)
2. Adding quick-buy options for 1-5 credits at €0.50 each in the Credit Shop

## Problem Statement

- Current credit button (coins + balance) doesn't clearly indicate it's for purchasing
- Users can only buy predefined packages, not small custom amounts
- Users who need just 1-2 credits are forced into larger package purchases

## Solution

### 1. Header Changes

**Current:**
```
[🪙 12]  [Language] [Profile] [Avatar]
```

**New:**
```
[🪙 12]  [+ Buy Credits]  [Language] [Profile] [Avatar]
```

**Button specifications:**
- Style: Outlined pill (visible but not loud)
- Border: `border-purple-500/50`, hover: `border-purple-400`
- Icon: Plus sign (`Plus` from lucide-react)
- Text: "Buy Credits" (EN) / "Acheter des crédits" (FR)
- Visibility: Only when signed in (same as balance)
- Action: Opens Credit Shop modal

**Mobile menu:**
- Keep balance display at top
- Add separate "Buy Credits" row below balance

### 2. Credit Shop Changes

**New Quick Buy section at top of modal:**

```
┌─────────────────────────────────────────────────┐
│  ⚡ Quick Buy                                    │
│  Need just a few credits? €0.50 each            │
│                                                 │
│  [ 1 ]  [ 2 ]  [ 3 ]  [ 4 ]  [ 5 ]              │
│  €0.50  €1.00  €1.50  €2.00  €2.50              │
│                                                 │
└─────────────────────────────────────────────────┘

───────── Better Value ─────────

[Existing package grid]
```

**Quick-pick behavior:**
- Clicking a button selects it (amber border/glow, same as packages)
- Mutual exclusion: selecting quick-pick deselects any package, and vice versa
- After selection, scroll to payment section (existing flow)
- Price displayed below each button

**Visual styling:**
- Compact square-ish pill buttons in a row
- Muted background section (`bg-slate-800/30` or similar)
- "⚡ Quick Buy" header
- Divider with "Better Value" text before packages

### 3. Packages Section

**Minor updates:**
- Add "Better Value" section header above package grid
- Optional tagline: "Get more credits for less"
- No structural changes to existing package UI

### 4. Pricing Model

| Purchase Type | Price per Credit |
|---------------|------------------|
| Quick Buy (1-5) | €0.50 |
| Packages | Varies (€0.30-0.45 depending on size) |

This incentivizes package purchases while offering convenience for small amounts.

## Technical Implementation

### Files to Modify

1. **`components/Header.tsx`**
   - Add "Buy Credits" button next to balance display (desktop)
   - Add "Buy Credits" row in mobile menu

2. **`components/CreditShop.tsx`**
   - Add quick-buy section above packages
   - Handle quick-buy selection state
   - Integrate quick-buy with existing payment flow

3. **`services/paymentService.ts`** (if needed)
   - May need endpoint for custom credit amounts
   - Or reuse existing checkout with dynamic pricing

4. **Backend: `server/src/routes/payments.ts`**
   - Add support for custom credit amounts in checkout
   - Validate amount is 1-5 for quick-buy

5. **Translations**
   - Add keys for new UI text

### State Changes in CreditShop

```typescript
// Current
const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);

// New - unified selection
type CreditSelection =
  | { type: 'package'; package: CreditPackage }
  | { type: 'quick'; credits: 1 | 2 | 3 | 4 | 5 };

const [selection, setSelection] = useState<CreditSelection | null>(null);
```

## Success Criteria

- [ ] "Buy Credits" button visible in header when signed in
- [ ] Button opens Credit Shop modal
- [ ] Quick-buy section appears above packages
- [ ] Can select 1-5 credits and complete purchase at €0.50/credit
- [ ] Selection is mutually exclusive (quick-buy OR package)
- [ ] Mobile menu has clear "Buy Credits" option
- [ ] Translations work for EN/FR
