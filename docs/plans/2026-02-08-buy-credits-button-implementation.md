# Buy Credits Button & Quick-Buy Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a visible "Buy Credits" button to the header and quick-buy options (1-5 credits at €0.50 each) in the Credit Shop.

**Architecture:** Frontend-first changes to Header.tsx and CreditShop.tsx, then backend changes to support custom credit amounts via a new `quick-buy` packageId pattern. The checkout flow reuses existing Stripe/PayPal infrastructure.

**Tech Stack:** React, TypeScript, Tailwind CSS, Express, Zod, Stripe, PayPal

---

## Task 1: Add "Buy Credits" Button to Header (Desktop)

**Files:**
- Modify: `components/Header.tsx:94-103` (after credit balance button)

**Step 1: Add the Buy Credits button after the balance display**

Find the existing credit balance button (lines 94-103) and add a new button after it:

```tsx
{isSignedIn && (
  <>
    <button
      onClick={() => setShowCreditShop(true)}
      data-credit-counter
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-900/30 border border-purple-500/30 hover:bg-purple-800/40 hover:border-purple-400/50 transition-colors cursor-pointer"
    >
      <Coins className="w-4 h-4 text-amber-400" />
      <span className="text-sm font-bold text-purple-100">{userCredits}</span>
    </button>
    <button
      onClick={() => setShowCreditShop(true)}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-purple-500/50 hover:border-purple-400 hover:bg-purple-900/30 transition-colors text-purple-200 hover:text-white text-sm"
    >
      <Plus className="w-3.5 h-3.5" />
      <span>{language === 'fr' ? 'Acheter' : 'Buy Credits'}</span>
    </button>
  </>
)}
```

**Step 2: Add Plus icon to imports**

Update the import line to include `Plus`:

```tsx
import { Menu, X, Shield, User, Coins, BookOpen, HelpCircle, CreditCard, Home, Sparkles, Plus } from 'lucide-react';
```

**Step 3: Verify the button renders correctly**

Run: `npm run dev` and check desktop nav shows both balance pill and "Buy Credits" button.

**Step 4: Commit**

```bash
git add components/Header.tsx
git commit -m "feat(header): add Buy Credits button to desktop nav"
```

---

## Task 2: Add "Buy Credits" Button to Mobile Menu

**Files:**
- Modify: `components/Header.tsx:176-188` (mobile menu user section)

**Step 1: Add a separate Buy Credits row in mobile menu**

After the existing user/balance display section (around line 188), add a new row:

```tsx
{isSignedIn && (
  <div className="flex items-center justify-between bg-purple-900/20 p-3 rounded-lg mb-4">
    <Link to={ROUTES.PROFILE} onClick={closeMobileMenu} className="text-slate-300 font-bold hover:text-white transition-colors">
      {displayName}
    </Link>
    <div className="flex items-center gap-2 text-amber-400">
      <Coins className="w-4 h-4" />
      <span className="font-bold">{userCredits}</span>
    </div>
  </div>
)}

{isSignedIn && (
  <button
    onClick={() => { setShowCreditShop(true); setIsMobileMenuOpen(false); }}
    className="flex items-center gap-3 w-full text-left p-3 rounded-lg bg-purple-900/40 border border-purple-500/30 hover:bg-purple-800/40 transition-colors text-purple-200 hover:text-white mb-2"
  >
    <Plus className="w-5 h-5" />
    {language === 'fr' ? 'Acheter des crédits' : 'Buy Credits'}
  </button>
)}
```

**Step 2: Remove the clickable credits from the existing user section**

Change the credits display from a button to a static display (remove onClick from credits part):

```tsx
{isSignedIn && (
  <div className="flex items-center justify-between bg-purple-900/20 p-3 rounded-lg mb-4">
    <Link to={ROUTES.PROFILE} onClick={closeMobileMenu} className="text-slate-300 font-bold hover:text-white transition-colors">
      {displayName}
    </Link>
    <div className="flex items-center gap-2 text-amber-400">
      <Coins className="w-4 h-4" />
      <span className="font-bold">{userCredits}</span>
    </div>
  </div>
)}
```

**Step 3: Verify mobile menu**

Run: `npm run dev`, resize to mobile, open menu - should see balance display and separate "Buy Credits" button.

**Step 4: Commit**

```bash
git add components/Header.tsx
git commit -m "feat(header): add Buy Credits button to mobile menu"
```

---

## Task 3: Add Quick-Buy Section to CreditShop (UI Only)

**Files:**
- Modify: `components/CreditShop.tsx`

**Step 1: Add quick-buy state and constants**

Near the top of the component (after existing state declarations around line 67), add:

```tsx
// Quick-buy options: 1-5 credits at €0.50 each
const QUICK_BUY_OPTIONS = [1, 2, 3, 4, 5] as const;
const QUICK_BUY_PRICE_PER_CREDIT = 0.50;

const [selectedQuickBuy, setSelectedQuickBuy] = useState<number | null>(null);
```

**Step 2: Update selection logic to be mutually exclusive**

Add handlers to ensure only one selection (quick-buy OR package) is active:

```tsx
const handleSelectQuickBuy = useCallback((credits: number) => {
  setSelectedQuickBuy(credits);
  setSelectedPackage(null);
  // Scroll to payment section
  setTimeout(() => {
    if (paymentSectionRef.current && modalContentRef.current) {
      const modal = modalContentRef.current;
      const paymentSection = paymentSectionRef.current;
      const paymentTop = paymentSection.offsetTop - 100;
      modal.scrollTo({ top: paymentTop, behavior: 'smooth' });
    }
  }, 300);
}, []);

// Update existing handleSelectPackage to clear quick-buy
const handleSelectPackage = useCallback((pkg: CreditPackage) => {
  setSelectedPackage(pkg);
  setSelectedQuickBuy(null);  // Add this line
  // ... rest of existing scroll logic
}, []);
```

**Step 3: Add Quick Buy section UI above packages**

In the modal content area (around line 363, before the package grid), add:

```tsx
{/* Quick Buy Section */}
<div className="mb-6 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
  <div className="flex items-center gap-2 mb-3">
    <Zap className="w-4 h-4 text-amber-400" />
    <h3 className="text-sm font-medium text-slate-200">
      {t('CreditShop.tsx.CreditShop.quick_buy', 'Quick Buy')}
    </h3>
    <span className="text-xs text-slate-400">
      {t('CreditShop.tsx.CreditShop.price_per_credit', '€0.50 per credit')}
    </span>
  </div>
  <div className="flex gap-2">
    {QUICK_BUY_OPTIONS.map((credits) => {
      const isSelected = selectedQuickBuy === credits;
      const price = (credits * QUICK_BUY_PRICE_PER_CREDIT).toFixed(2);
      return (
        <button
          key={credits}
          onClick={() => handleSelectQuickBuy(credits)}
          className={`flex-1 py-3 px-2 rounded-lg border-2 transition-all text-center ${
            isSelected
              ? 'border-amber-400 bg-amber-900/30 shadow-lg shadow-amber-500/20'
              : 'border-slate-600 bg-slate-800/50 hover:border-purple-500/50'
          }`}
        >
          <div className="text-xl font-bold text-white">{credits}</div>
          <div className={`text-xs ${isSelected ? 'text-amber-300' : 'text-slate-400'}`}>
            €{price}
          </div>
        </button>
      );
    })}
  </div>
</div>

{/* Better Value Divider */}
<div className="flex items-center gap-3 mb-4">
  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
  <span className="text-xs text-slate-400 uppercase tracking-wider">
    {t('CreditShop.tsx.CreditShop.better_value', 'Better Value')}
  </span>
  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
</div>
```

**Step 4: Verify the UI renders**

Run: `npm run dev`, open Credit Shop - should see Quick Buy section at top, then "Better Value" divider, then packages.

**Step 5: Commit**

```bash
git add components/CreditShop.tsx
git commit -m "feat(credit-shop): add quick-buy section UI"
```

---

## Task 4: Update Payment Section to Handle Quick-Buy

**Files:**
- Modify: `components/CreditShop.tsx`

**Step 1: Create a unified selection helper**

Add this computed value after the state declarations:

```tsx
// Unified selection for payment section
const currentSelection = useMemo(() => {
  if (selectedQuickBuy) {
    return {
      type: 'quick' as const,
      credits: selectedQuickBuy,
      priceEur: selectedQuickBuy * QUICK_BUY_PRICE_PER_CREDIT,
      packageId: `quick-${selectedQuickBuy}`,
      name: `${selectedQuickBuy} Credit${selectedQuickBuy > 1 ? 's' : ''}`,
    };
  }
  if (selectedPackage) {
    return {
      type: 'package' as const,
      credits: selectedPackage.credits,
      priceEur: selectedPackage.priceEur,
      packageId: selectedPackage.id,
      name: selectedPackage.nameEn,
    };
  }
  return null;
}, [selectedQuickBuy, selectedPackage]);
```

**Step 2: Update handleStripeCheckout to use unified selection**

Replace the existing `handleStripeCheckout` function:

```tsx
const handleStripeCheckout = useCallback(async (useLink: boolean) => {
  if (!currentSelection) return;

  // Check spending limits first
  if (!checkSpendingLimits(currentSelection.priceEur)) {
    return;
  }

  setLoading(true);
  setError(null);
  setPaymentMethod(useLink ? 'stripe_link' : 'stripe');

  try {
    const token = await getToken();
    if (!token) throw new Error('Authentication required');

    // Record the purchase attempt
    recordPurchase(currentSelection.priceEur, currentSelection.name);

    const { url } = await createStripeCheckout(token, currentSelection.packageId, useLink);
    if (url) {
      redirectToStripeCheckout(url);
    } else {
      throw new Error('No checkout URL received');
    }
  } catch (err) {
    console.error('Stripe checkout error:', err);
    const message = err instanceof Error ? err.message : 'Payment failed';
    if (message === 'Failed to fetch') {
      setError(t('CreditShop.tsx.CreditShop.unable_to_connect', 'Unable to connect to payment server. Please check your connection and try again.'));
    } else {
      setError(message);
    }
  } finally {
    setLoading(false);
    setPaymentMethod(null);
  }
}, [currentSelection, getToken, checkSpendingLimits, recordPurchase, t]);
```

**Step 3: Update handlePayPalCheckout similarly**

```tsx
const handlePayPalCheckout = useCallback(async () => {
  if (!currentSelection) return;

  // Check spending limits first
  if (!checkSpendingLimits(currentSelection.priceEur)) {
    return;
  }

  setLoading(true);
  setError(null);
  setPaymentMethod('paypal');

  try {
    const token = await getToken();
    if (!token) throw new Error('Authentication required');

    // Record the purchase attempt
    recordPurchase(currentSelection.priceEur, currentSelection.name);

    const { approvalUrl } = await createPayPalOrder(token, currentSelection.packageId);
    if (approvalUrl) {
      window.location.href = approvalUrl;
    } else {
      throw new Error('No approval URL received');
    }
  } catch (err) {
    console.error('PayPal checkout error:', err);
    const message = err instanceof Error ? err.message : 'Payment failed';
    if (message === 'Failed to fetch') {
      setError(t('CreditShop.tsx.CreditShop.unable_to_connect', 'Unable to connect to payment server. Please check your connection and try again.'));
    } else {
      setError(message);
    }
    setLoading(false);
    setPaymentMethod(null);
  }
}, [currentSelection, getToken, checkSpendingLimits, recordPurchase, t]);
```

**Step 4: Update payment section condition**

Change the payment section from `{selectedPackage ? (` to `{currentSelection ? (`:

```tsx
{currentSelection ? (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-4"
  >
    {/* Section header with selected summary */}
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-heading text-white flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-purple-400" />
        {t('CreditShop.tsx.CreditShop.complete_purchase', 'Complete Purchase')}
      </h3>
      <div className="flex items-center gap-2 bg-amber-900/30 px-3 py-1.5 rounded-lg border border-amber-500/30">
        <Coins className="w-4 h-4 text-amber-400" />
        <span className="font-bold text-amber-300">{currentSelection.credits}</span>
        <span className="text-amber-200/70 text-sm">
          {t('CreditShop.tsx.CreditShop.credits_3', 'credits')}
        </span>
      </div>
    </div>
    {/* ... rest of payment buttons use currentSelection.priceEur ... */}
```

**Step 5: Update price displays in payment buttons**

Replace all instances of `selectedPackage.priceEur` with `currentSelection.priceEur` in the payment section.

**Step 6: Verify frontend integration works**

Run: `npm run dev`, select a quick-buy option (e.g., 2 credits), verify payment section shows "2 credits" and "€1.00".

**Step 7: Commit**

```bash
git add components/CreditShop.tsx
git commit -m "feat(credit-shop): integrate quick-buy with payment section"
```

---

## Task 5: Backend - Support Quick-Buy Package IDs

**Files:**
- Modify: `server/src/routes/payments.ts:16-23` (validation schemas)
- Modify: `server/src/application/use-cases/payments/CreateCheckout.ts:105-125` (package lookup)

**Step 1: Update validation schema to accept quick-buy IDs**

In `payments.ts`, update the schema:

```ts
const stripeCheckoutSchema = z.object({
  packageId: z.string().refine(
    (val) => ['starter', 'basic', 'popular', 'value', 'premium'].includes(val) || /^quick-[1-5]$/.test(val),
    { message: 'Invalid package ID' }
  ),
  useStripeLink: z.boolean().optional().default(false),
});

const paypalOrderSchema = z.object({
  packageId: z.string().refine(
    (val) => ['starter', 'basic', 'popular', 'value', 'premium'].includes(val) || /^quick-[1-5]$/.test(val),
    { message: 'Invalid package ID' }
  ),
});
```

**Step 2: Update CreateCheckout use case to handle quick-buy**

In `CreateCheckout.ts`, update the package lookup logic:

```ts
// Add helper function at top of file (after CREDIT_PACKAGES)
const QUICK_BUY_PRICE_PER_CREDIT = 0.50;

function getPackageForId(packageId: string): CreditPackage | null {
  // Check if it's a quick-buy package
  const quickBuyMatch = packageId.match(/^quick-([1-5])$/);
  if (quickBuyMatch) {
    const credits = parseInt(quickBuyMatch[1], 10);
    return {
      id: packageId,
      credits,
      priceEur: credits * QUICK_BUY_PRICE_PER_CREDIT,
      name: `Quick Buy ${credits}`,
      nameEn: `${credits} Credit${credits > 1 ? 's' : ''}`,
      nameFr: `${credits} Crédit${credits > 1 ? 's' : ''}`,
      labelEn: 'Quick Buy',
      labelFr: 'Achat Rapide',
      discount: 0,
      badge: null,
    };
  }

  // Otherwise look up in predefined packages
  return CREDIT_PACKAGES.find(p => p.id === packageId) || null;
}
```

**Step 3: Use the helper in execute method**

Replace the package lookup in `execute()`:

```ts
// 2. Find the credit package
const creditPackage = getPackageForId(input.packageId);
if (!creditPackage) {
  return {
    success: false,
    error: 'Invalid package',
    errorCode: 'INVALID_PACKAGE',
  };
}
```

**Step 4: Test the backend accepts quick-buy IDs**

Start the backend: `cd server && npm run dev`

Test with curl (replace token with a valid one):
```bash
curl -X POST http://localhost:3001/api/payments/stripe/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"packageId": "quick-2"}'
```

Expected: Should return a checkout URL (or auth error if no token).

**Step 5: Commit**

```bash
git add server/src/routes/payments.ts server/src/application/use-cases/payments/CreateCheckout.ts
git commit -m "feat(api): support quick-buy package IDs (quick-1 through quick-5)"
```

---

## Task 6: End-to-End Testing

**Files:**
- No new files, manual testing

**Step 1: Test desktop "Buy Credits" button**

1. Start both servers: `npm run dev` and `cd server && npm run dev`
2. Sign in as a user
3. Click "Buy Credits" button in header
4. Verify Credit Shop modal opens

**Step 2: Test mobile "Buy Credits" button**

1. Resize to mobile viewport
2. Open hamburger menu
3. Click "Buy Credits" row
4. Verify Credit Shop modal opens

**Step 3: Test quick-buy selection**

1. Open Credit Shop
2. Click "2" in Quick Buy section
3. Verify: "2" is highlighted, no package is selected
4. Verify: Payment section shows "2 credits" and "€1.00"

**Step 4: Test mutual exclusion**

1. With "2" selected in quick-buy, click a package
2. Verify: "2" is deselected, package is selected
3. Click "3" in quick-buy
4. Verify: package is deselected, "3" is selected

**Step 5: Test Stripe checkout for quick-buy**

1. Select "1" credit (€0.50)
2. Click "Credit / Debit Card"
3. Verify: Redirects to Stripe checkout with correct amount
4. Complete test payment (use Stripe test card 4242...)
5. Verify: Credits are added to account

**Step 6: Document any issues found**

If issues found, create follow-up tasks.

**Step 7: Final commit**

```bash
git add -A
git commit -m "feat: complete buy credits button and quick-buy implementation

- Add visible Buy Credits button to header (desktop + mobile)
- Add quick-buy section for 1-5 credits at €0.50 each
- Backend supports quick-buy package IDs
- Mutual exclusion between quick-buy and packages"
```

---

## Summary

| Task | Description | Estimated Complexity |
|------|-------------|---------------------|
| 1 | Desktop Buy Credits button | Simple |
| 2 | Mobile Buy Credits button | Simple |
| 3 | Quick-buy section UI | Medium |
| 4 | Payment section integration | Medium |
| 5 | Backend quick-buy support | Medium |
| 6 | End-to-end testing | Simple |
