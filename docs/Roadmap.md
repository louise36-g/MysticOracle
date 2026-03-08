# CelestiArcana Roadmap

> High-level roadmap for the CelestiArcana web platform.

---

## Vision

CelestiArcana is a standalone product offering monetized tarot readings, daily horoscopes, and tarot education content.

---

## Stabilization — Complete ✅

**Goal:** Fix known issues, ensure reliability.

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
- [x] Prisma v5 → v7 (v7.4.2 with adapter-pg, prisma-client generator)

### Quality & Observability
- [x] ESLint 9 + Prettier configured (0 lint issues)
- [x] 509 backend tests across 30 test files
- [x] 38 E2E tests across 7 test files
- [x] Sentry error tracking + performance monitoring
- [x] Environment variable validation at startup

### Tech Debt Cleared
- [x] Content systems consolidated (BlogPost table with contentType)
- [x] localStorage ghost keys removed
- [x] useAdminCrud hook adopted across 6 admin components
- [x] Dead code removal, large component splits, DB indexes

---

## Platform Enhancements — Future

Ideas for when the time is right. No timeline or commitment.

- [ ] Reading sharing (social)
- [ ] Journaling features
- [ ] Guided learning paths
- [ ] Numerology

---

## On Hold

These are paused until the relevant projects progress further.

### Tarot Saga Mobile Funnel
Mobile game is not currently in development. When it resumes:
- Design Fool's Journey teaser (web preview)
- Smart app banners, download landing page, deep linking
- Shared backend endpoints (`/api/game/progress`, chapters, achievements)
- New Prisma models (SagaProgress, GameChapter)

### New Divination Tools
Not planned for the website at this time:
- Rune Readings
- Birth Chart / Natal Chart
- I Ching

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
| Daily active users | Grow 10% month-over-month |
| Reading completion rate | 80%+ |
| Credit purchase rate | 5%+ of active users |
| Horoscope return rate | 40%+ daily return |

---

*Roadmap updated: March 2026*
