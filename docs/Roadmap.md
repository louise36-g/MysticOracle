# CelestiArcana Roadmap

> High-level roadmap for the CelestiArcana web platform.

---

## Vision

CelestiArcana serves two purposes:
1. **Standalone Product:** Monetized tarot readings and horoscopes
2. **Mobile Funnel:** Gateway to Tarot Saga mobile game

---

## Current Phase: Stabilization ✅

**Goal:** Fix known issues, ensure reliability before mobile launch.

### Immediate Tasks
- [x] Verify horoscope generation with valid API key
- [x] Clean up removed endpoint references
- [x] Test credit flow end-to-end
- [x] Verify payment webhooks in production

### Short-term Improvements
- [x] Add error boundaries (per-route + reading flow + admin)
- [x] Improve loading state consistency
- [x] Audit and fix console warnings (0 issues remaining)

### Dependency Upgrades
- [x] Stripe v14 → v20
- [x] Clerk Backend v1 → v2
- [x] React Router v6 → v7
- [x] Prisma v5 → v6 (v1.2-prisma-v6, Feb 28 2026)
- [ ] Prisma v6 → v7 (deferred — requires Dockerfile + adapter-pg for Coolify)

### Quality & Observability
- [x] ESLint 9 + Prettier configured (0 lint issues)
- [x] 509 tests across 30 test files
- [x] Sentry error tracking + performance monitoring
- [x] Environment variable validation at startup

---

## Next Phase: Mobile Funnel

**Goal:** Create compelling preview of Tarot Saga to drive app downloads.

### Tarot Saga Preview
- [ ] Design Fool's Journey teaser (web version)
- [ ] Implement 2-3 "chapters" as taste of full experience
- [ ] Create cliffhanger moment → "Continue in the app"
- [ ] Track conversion from preview to download

### App Store Integration
- [ ] Add smart app banners (iOS Safari)
- [ ] Create dedicated download landing page
- [ ] Implement deep linking for "Continue your journey"
- [ ] A/B test CTA placement and messaging

---

## Future Phase: Shared Backend

**Goal:** Prepare Express API for mobile app consumption.

### New Endpoints
- [ ] `POST /api/game/progress` - Save saga progress
- [ ] `GET /api/game/progress` - Load saga progress
- [ ] `POST /api/game/chapters/:id/complete` - Mark chapter complete
- [ ] `GET /api/game/achievements` - Game-specific achievements

### Database Extensions
- [ ] Add SagaProgress model
- [ ] Add GameChapter model
- [ ] Add cross-platform sync logic

### Mobile Considerations
- [x] API versioning (`/api/v1/`) — implemented
- [ ] Add mobile-specific rate limits
- [ ] Implement offline sync queue support

---

## Long-term: Feature Expansion

### New Divination Tools
- [ ] Rune Readings
- [ ] Birth Chart / Natal Chart
- [ ] I Ching
- [ ] Numerology

### Platform Enhancements
- [ ] Reading sharing (social)
- [ ] Journaling features
- [ ] Guided learning paths
- [ ] Community features (carefully considered)

---

## Non-Goals

Things we're explicitly **not** doing:

- Social features that compromise privacy
- Subscription model (credits work better)
- Live reader connections (AI only)
- Gambling or prediction markets
- NFT / blockchain integration

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Web → App conversion | 15%+ of preview completers |
| Daily active users | Grow 10% month-over-month |
| Reading completion rate | 80%+ |
| Credit purchase rate | 5%+ of active users |
| Horoscope return rate | 40%+ daily return |

---

*Roadmap updated: February 2026*
