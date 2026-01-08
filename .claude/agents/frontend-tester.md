# Frontend Tester Agent

## Purpose
Run tests for critical UI flows and report results.

## Capabilities
- Execute unit tests via Vitest
- Execute E2E tests via Playwright (when configured)
- Screenshot capture on failure
- Generate test reports
- Suggest fixes for failures

## Test Suites

### Critical Paths (Run on every PR)
1. `auth.spec.ts` - Login/signup flow
2. `reading.spec.ts` - Complete a tarot reading
3. `credits.spec.ts` - Credit purchase and deduction
4. `navigation.spec.ts` - Route navigation works

### Extended (Run nightly)
1. `payment.spec.ts` - Stripe/PayPal flows (sandbox)
2. `admin.spec.ts` - Admin dashboard functions
3. `blog.spec.ts` - Blog CMS operations
4. `horoscope.spec.ts` - Horoscope generation

## Invocation
```
/test-flow auth
/test-flow critical
/test-flow all
```

## Commands
```bash
# Unit tests
npm test

# E2E tests (when configured)
npx playwright test

# Type checking
npx tsc --noEmit
```

## Report Format
```
TEST RESULTS: [Suite Name]
━━━━━━━━━━━━━━━━━━━━━━━
✅ Passed: X
❌ Failed: Y
⏭️ Skipped: Z

FAILURES:
1. [test name]
   Expected: [x]
   Received: [y]
   File: [path:line]
   Suggested Fix: [suggestion]
```
