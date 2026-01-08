# MysticOracle Project Status

> Current state of features and known issues.

---

## Last Updated: January 2026

---

## Feature Status

### Core Features

| Feature | Status | Notes |
|---------|--------|-------|
| User Authentication (Clerk) | ✅ Working | Sign in, sign up, SSO |
| Tarot Readings | ✅ Working | 6 spread types, AI interpretation |
| Follow-up Questions | ✅ Working | 2 questions per credit |
| User Reflections | ✅ Working | Saved to backend |
| Reading History | ✅ Working | Full history with interpretation |
| Credit System | ✅ Working | Purchase, spend, earn |
| Daily Bonus | ✅ Working | 2 credits daily, streak bonus |
| Stripe Payments | ✅ Working | Checkout sessions |
| PayPal Payments | ✅ Working | Order capture flow |

### Secondary Features

| Feature | Status | Notes |
|---------|--------|-------|
| Daily Horoscope | ⚠️ Needs Config | Requires OPENROUTER_API_KEY |
| Blog CMS | ✅ Working | Posts, categories, tags, media |
| Admin Dashboard | ✅ Working | Users, transactions, analytics |
| Multi-language (EN/FR) | ✅ Working | Full translation support |
| Achievements | ✅ Working | Basic achievement system |
| Referral System | ✅ Working | Referral codes, bonuses |

### Planned Features

| Feature | Status | Notes |
|---------|--------|-------|
| Tarot Saga Preview | 🔜 Planned | Mobile funnel teaser |
| Rune Readings | 🔜 Coming Soon | UI placeholder exists |
| Birth Chart | 🔜 Coming Soon | UI placeholder exists |
| I Ching | 🔜 Coming Soon | UI placeholder exists |

---

## Environment Requirements

```env
# Required for full functionality
OPENROUTER_API_KEY=sk-or-xxxxx    # AI interpretations
CLERK_SECRET_KEY=sk_xxxxx         # Authentication
DATABASE_URL=postgresql://...      # Database
STRIPE_SECRET_KEY=sk_xxxxx        # Payments
```

---

## Recent Fixes (This Session)

- ✅ Fixed double credit deduction bug
- ✅ Fixed 0-card readings being saved
- ✅ Fixed reading history not persisting interpretation
- ✅ Fixed follow-up questions not saving to backend
- ✅ Added transaction history to user profile
- ✅ Updated follow-up pricing to 2 questions per credit
- ✅ Improved horoscope error handling

---

## Known Issues

See [Tech_debt.md](./Tech_debt.md) for detailed list.
