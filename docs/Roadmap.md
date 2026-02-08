# CelestiArcana Roadmap

> High-level roadmap for the CelestiArcana web platform.

---

## Vision

CelestiArcana serves two purposes:
1. **Standalone Product:** Monetized tarot readings and horoscopes
2. **Mobile Funnel:** Gateway to Tarot Saga mobile game

---

## Current Phase: Stabilization

**Goal:** Fix known issues, ensure reliability before mobile launch.

### Immediate Tasks
- [ ] Verify horoscope generation with valid API key
- [ ] Clean up removed endpoint references
- [ ] Test credit flow end-to-end
- [ ] Verify payment webhooks in production

### Short-term Improvements
- [ ] Add error boundaries
- [ ] Improve loading state consistency
- [ ] Audit and fix console warnings

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
- [ ] Consider API versioning (`/api/v1/`)
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

*Roadmap updated: January 2026*
