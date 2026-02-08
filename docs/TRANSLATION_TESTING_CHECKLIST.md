# Translation System Testing Checklist

**Date:** 2026-01-13
**Project:** CelestiArcana Dynamic Translations Refactor

## Overview

This checklist verifies that the dynamic translation system works correctly across all user flows with English as the default language.

## Pre-Testing Setup

- [ ] Backend server running
- [ ] Frontend dev server running
- [ ] Database has latest translations (click "Update Translations" in admin)
- [ ] Browser cache cleared (localStorage.clear())
- [ ] Test with fresh incognito/private window

---

## Test 1: Unauthenticated User Flow

### Homepage
- [ ] Navigation menu shows English labels (Home, Reading, Horoscope, Profile, Admin, Sign In)
- [ ] Hero section shows English text
- [ ] Footer shows English links (Privacy Policy, Terms, Cookies, Contact)

### Blog
- [ ] Blog list shows English UI (Recent Posts, filters, pagination)
- [ ] Blog post shows English UI (Back to Blog, Share, Tags, Related Articles)
- [ ] All buttons and labels are in English

### Tarot Cards
- [ ] Tarot cards overview shows English (The Tarot Deck, Browse All Cards)
- [ ] Card preview modals show English text
- [ ] Category sections show English labels

### Sign In
- [ ] Sign in button shows "Sign In" (not "Connexion")
- [ ] Clerk authentication modal appears correctly

**Result:** ✅ PASS / ❌ FAIL
**Notes:**

---

## Test 2: Authenticated User Flow

### Navigation
- [ ] User is logged in successfully
- [ ] Header shows username and "Sign Out" button
- [ ] Credits display shows number + "credits" label in English

### Start Reading
- [ ] Spread selector shows English spread names
- [ ] Cost labels show "credit" / "credits" in English
- [ ] Question input placeholder is in English
- [ ] "Start Reading" button is in English

### Reading Flow
- [ ] Shuffle phase shows English instructions
- [ ] Card selection shows English prompts
- [ ] Interpretation shows English labels
- [ ] Follow-up questions interface is in English
- [ ] Error messages (insufficient credits) show in English

### Horoscope
- [ ] Zodiac sign selector shows English names
- [ ] "Daily Horoscope" title is in English
- [ ] Question input and suggestions are in English
- [ ] Chat interface shows English labels

### Profile Page
- [ ] Page title shows "Your Profile"
- [ ] Tab labels are in English (Reading History, Achievements, Credit History)
- [ ] Credit summary shows English labels (Purchased, Earned, Spent)
- [ ] **Transaction types show English:**
  - [ ] "Purchase" (not "Achat")
  - [ ] "Daily Bonus" (not "Bonus quotidien")
  - [ ] "Achievement" (not "Succès")
  - [ ] "Referral" (not "Parrainage")
  - [ ] "Reading" (not "Lecture")
  - [ ] "Question" (not "Question")
- [ ] **Transaction filters show English:**
  - [ ] Type: All / Purchases / Bonuses / Readings
  - [ ] Date Range: All Time / Today / This Week / This Month
  - [ ] Clear filters button
- [ ] Dates show relative format: "Today", "Yesterday", "X days ago"
- [ ] Achievement cards show English labels
- [ ] Empty states show English messages

### Credit Shop
- [ ] Credit packages show English labels
- [ ] "Buy Credits" button is in English
- [ ] Package descriptions are in English
- [ ] Payment buttons show "Pay with Card" / "Pay with PayPal"

### Daily Bonus
- [ ] Daily bonus popup shows English text
- [ ] "Claim" button is in English
- [ ] Bonus amount and streak display correctly

**Result:** ✅ PASS / ❌ FAIL
**Notes:**

---

## Test 3: Admin User Flow

### Admin Dashboard
- [ ] Admin tab appears in navigation
- [ ] Dashboard tabs show English labels (Overview, Users, Transactions, Analytics, etc.)

### Admin Translations
- [ ] "Translations" tab accessible
- [ ] "Update Translations" button visible and functional
- [ ] Language selector shows "English" and "Français"
- [ ] Translation list shows keys and values correctly
- [ ] Can edit and save translations
- [ ] Changes reflect immediately after save

### Other Admin Sections
- [ ] Users section shows English labels
- [ ] Transactions section shows English labels and filters
- [ ] Analytics charts show English labels
- [ ] All admin UI is in English by default

**Result:** ✅ PASS / ❌ FAIL
**Notes:**

---

## Test 4: Language Switching

### Switch to French
- [ ] Language selector in header works
- [ ] UI immediately switches to French
- [ ] Transaction history shows French labels (Achat, Bonus quotidien, etc.)
- [ ] Filters show French labels (Tout, Achats, Bonus, Lectures)
- [ ] Navigation shows French labels
- [ ] All user-facing text switches to French

### Switch Back to English
- [ ] Switch back to English works
- [ ] ALL text returns to English (verify no French remains)
- [ ] Transaction history shows English labels again
- [ ] Filters show English labels again
- [ ] No mixed languages anywhere

**Result:** ✅ PASS / ❌ FAIL
**Notes:**

---

## Test 5: Error Handling

### Insufficient Credits
- [ ] Try to start reading without enough credits
- [ ] Error message shows "Insufficient credits" (not French)
- [ ] Message is clear and actionable

### Network Errors
- [ ] Disconnect from internet
- [ ] Try to perform action (e.g., start reading)
- [ ] Error message shows in English
- [ ] Graceful fallback behavior

### Missing Translations
- [ ] If a translation key is missing, fallback shows English text
- [ ] No "undefined" or blank text anywhere
- [ ] Console warnings for missing keys (if dev mode enabled)

**Result:** ✅ PASS / ❌ FAIL
**Notes:**

---

## Test 6: Cache and Performance

### Translation Loading
- [ ] First page load fetches translations from API
- [ ] Subsequent loads use cached translations (check Network tab)
- [ ] Cache invalidation works (after admin updates translations)
- [ ] Page loads fast (no translation-related delays)

### Browser Refresh
- [ ] Refresh page maintains language selection
- [ ] Translations load correctly from cache
- [ ] No flash of untranslated content (FOUC)

**Result:** ✅ PASS / ❌ FAIL
**Notes:**

---

## Test 7: Edge Cases

### New User
- [ ] Brand new user sees all English by default
- [ ] First reading experience is fully in English
- [ ] Welcome modal (if any) shows English

### User with French Preference
- [ ] User with language=fr in profile sees French by default
- [ ] Switching to English works and persists
- [ ] Profile saves language preference correctly

### Mobile View
- [ ] All translations work on mobile viewport
- [ ] No text overflow or truncation issues
- [ ] Navigation and filters work correctly

**Result:** ✅ PASS / ❌ FAIL
**Notes:**

---

## Bugs Found

| Bug # | Description | Severity | Status |
|-------|-------------|----------|--------|
| 1 | | | |
| 2 | | | |
| 3 | | | |

---

## Summary

**Total Tests:** 7
**Passed:** ___
**Failed:** ___

**Critical Issues:** ___
**Minor Issues:** ___

**Overall Assessment:** ✅ Ready for Production / ⚠️ Needs Minor Fixes / ❌ Needs Major Work

**Sign-off:**
- Tester: ________________
- Date: ________________
- Notes:

---

## Next Steps

If all tests pass:
- [ ] Mark Task 12 complete
- [ ] Proceed to Task 13 (dev warnings)
- [ ] Update documentation (Task 14)
- [ ] Final cleanup (Task 15)

If tests fail:
- [ ] Document bugs in table above
- [ ] Create fix plan
- [ ] Re-test after fixes
