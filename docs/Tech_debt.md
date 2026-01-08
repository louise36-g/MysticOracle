# MysticOracle Technical Debt

> Known issues, inconsistencies, and areas needing improvement.

---

## Last Updated: January 2026

---

## High Priority

### 1. Removed API Endpoint Still Referenced

**Location:** `services/apiService.ts`

The `/api/readings/deduct-credits` endpoint was removed from backend for security, but `apiService.ts` still has the function. Currently harmless (endpoint returns 404, frontend catches and continues), but should be cleaned up.

**Fix:** Remove `deductCredits` function from apiService.ts, update any remaining callers.

---

### 2. Horoscope Generation Fails Without Clear Error

**Location:** `server/src/routes/horoscopes.ts`

When `OPENROUTER_API_KEY` is missing, the error message wasn't clear. Improved in this session but needs testing.

**Fix:** Verify error messages display correctly in production.

---

## Medium Priority

### 3. Large Component Files

**Locations:**
- `components/ActiveReading.tsx` (~900 lines)
- `components/admin/AdminBlog.tsx` (~800 lines)
- `components/UserProfile.tsx` (~600 lines)

These components handle too many concerns and are difficult to maintain.

**Fix:** Extract sub-components, use custom hooks for logic.

---

### 4. Inconsistent Credit Deduction Patterns

**Issue:** Some features deduct credits on frontend (validation only), others rely entirely on backend.

**Current State:**
- Tarot readings: Frontend validates → Backend deducts
- Follow-up questions: Frontend validates → Backend deducts
- Horoscope questions: Frontend deducts locally

**Fix:** Standardize all credit operations to backend-only with frontend validation.

---

### 5. LocalStorage vs Backend History

**Issue:** Some code still references `history` from AppContext (localStorage-based) while reading history now comes from backend.

**Fix:** Audit all `useApp()` calls for `history` usage, remove localStorage history code.

---

## Low Priority

### 6. Missing Error Boundaries

**Issue:** React components don't have error boundaries. Uncaught errors crash entire app.

**Fix:** Add error boundaries at route level and around critical components.

---

### 7. No Test Coverage

**Issue:** No unit tests, integration tests, or E2E tests.

**Fix:** Add Jest for unit tests, consider Playwright for E2E.

---

### 8. Console Warnings in Development

**Issue:** Various React warnings about keys, dependencies, etc.

**Fix:** Audit and fix warnings one by one.

---

### 9. Hardcoded Strings

**Issue:** Some UI strings are hardcoded instead of using translation system.

**Fix:** Move all user-facing strings to translation files.

---

### 10. No API Versioning

**Issue:** API endpoints don't have version prefix (`/api/v1/`).

**Fix:** Consider adding versioning before mobile app launch to allow independent evolution.

---

## Tracking

| Issue | Priority | Status | Assigned |
|-------|----------|--------|----------|
| Removed endpoint reference | High | Open | - |
| Horoscope error messages | High | Improved | - |
| Large components | Medium | Open | - |
| Credit deduction patterns | Medium | Partial | - |
| LocalStorage history | Medium | Open | - |
| Error boundaries | Low | Open | - |
| Test coverage | Low | Open | - |
| Console warnings | Low | Open | - |
| Hardcoded strings | Low | Open | - |
| API versioning | Low | Open | - |
