# MysticOracle Constitution

> Core principles governing the MysticOracle web platform and Tarot Saga mobile game.
> This document is the source of truth for product decisions across both platforms.

---

## Mission

**Deliver meaningful tarot experiences through AI-powered interpretations, treating users as intelligent adults seeking genuine insight and reflection.**

We bridge ancient wisdom with modern technology — not to predict the future, but to offer perspective, spark self-reflection, and create moments of genuine connection with tarot symbolism.

---

## Core Principles

### 1. Respect User Intelligence

- Write for intelligent adults new to tarot — explain concepts when needed, never condescend
- No patronizing phrases ("my dear", "as you know", "well now")
- No over-explanation of basic concepts
- Direct, informative tone — not chatty or overly familiar
- Trust users to draw their own conclusions

### 2. Authenticity Over Gimmicks

- Use genuine Rider-Waite-Smith tarot tradition
- Real card meanings, real spread positions, real symbolism
- No lucky numbers, lucky colors, or fortune-cookie predictions
- AI enhances accessibility — it doesn't replace authentic tarot wisdom
- Readings are tools for reflection, not divination

### 3. Ethical Monetization

- Clear, honest pricing — no hidden costs or dark patterns
- Credits never expire
- Free tier provides genuine value (not crippled experience)
- Paid features offer depth, not artificial gates
- Refunds evaluated fairly on case-by-case basis

### 4. Privacy as Default

- User readings, questions, and reflections are private
- No selling or sharing user data
- GDPR compliant (EU data storage)
- Minimal data collection — only what's needed
- Clear, readable privacy policy

### 5. Graceful Degradation

- Always provide feedback when something fails
- Never leave users in loading limbo
- Offline-friendly where possible (mobile)
- Cached content serves when AI unavailable
- Error messages are helpful, not cryptic

---

## Product Boundaries

### What We Are

- AI-powered tarot reading platform
- Tool for self-reflection and perspective
- Educational resource for tarot symbolism
- Entertainment with depth and meaning
- Gateway to the Tarot Saga journey

### What We Are NOT

- Fortune-telling or prediction service
- Replacement for professional advice (medical, legal, financial)
- Gambling or games of chance
- Social network or community platform
- Subscription trap

---

## Platform Strategy

### Web (MysticOracle)

**Purpose:** Standalone product + mobile funnel

| Function | Goal |
|----------|------|
| Free Readings | Taste of AI interpretation quality |
| Paid Readings | Revenue via credits system |
| Daily Horoscope | Engagement hook, daily return visits |
| Tarot Saga Preview | Funnel to mobile download |
| Blog | SEO, education, trust building |
| Coming Soon Tools | Future expansion (runes, I Ching, birth charts) |

### Mobile (Tarot Saga)

**Purpose:** Full narrative tarot experience

| Function | Goal |
|----------|------|
| Fool's Journey | 22-chapter narrative through Major Arcana |
| Progressive Unlocking | Engagement through discovery |
| Deeper Readings | Full spread experiences |
| Offline Support | Read anywhere |
| Push Notifications | Daily engagement |

### Shared Infrastructure

- **Authentication:** Clerk (same account across platforms)
- **Backend:** Express + Prisma + PostgreSQL (single source of truth)
- **Credits:** Purchased anywhere, usable everywhere
- **User Progress:** Synced between web preview and mobile full experience

---

## Design Language

### Visual Identity

- **Palette:** Deep slate, purple gradients, amber/gold accents
- **Typography:** Heading font for mystical feel, clean sans-serif for body
- **Imagery:** Rider-Waite-Smith cards, cosmic/celestial motifs
- **Animations:** Subtle, purposeful — card flips, fades, gentle movement
- **Dark theme:** Primary experience (mystical atmosphere)

### Voice & Tone

| Context | Tone |
|---------|------|
| Readings | Warm, insightful, respectful |
| Errors | Helpful, apologetic, actionable |
| Marketing | Intriguing, inviting, honest |
| Legal | Clear, plain language, no legalese |
| Onboarding | Welcoming, not overwhelming |

### Content Guidelines

- **Do:** Use flowing prose, explain astrological/tarot terms naturally
- **Don't:** Use bullet points in readings, tables, emojis in interpretations
- **Do:** Reference specific cards, positions, planetary influences
- **Don't:** Make definitive predictions or guarantees
- **Do:** Encourage reflection and personal interpretation
- **Don't:** Create dependency or anxiety

---

## Technical Principles

### Code Quality

- TypeScript everywhere (strict mode)
- Zod validation at API boundaries
- Prisma for type-safe database access
- Component-based architecture
- Meaningful error messages in console

### Security

- Clerk handles all authentication
- JWT verification on protected routes
- No secrets in client code
- Input sanitization (DOMPurify for HTML)
- Webhook signature verification

### Performance

- Lazy loading for heavy components
- Image optimization
- API response caching where appropriate
- Database indexes on frequent queries
- Pagination on list endpoints

### Maintainability

- Clear file naming conventions
- Colocated related code
- Avoid premature abstraction
- Document non-obvious decisions
- Keep dependencies updated

---

## Decision Framework

When facing product or technical decisions, ask:

1. **Does this respect user intelligence?**
2. **Is this authentic to tarot tradition?**
3. **Is this monetization ethical?**
4. **Does this protect user privacy?**
5. **Does this fail gracefully?**

If the answer to any is "no" — reconsider the approach.

---

## Technical Standards (Detailed)

### Tech Stack (Non-Negotiable)

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + TypeScript (strict) |
| Build | Vite |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| Auth | Clerk |
| Backend | Express.js + TypeScript |
| Database | PostgreSQL (Render Frankfurt EU) |
| ORM | Prisma |
| Validation | Zod |
| Payments | Stripe + PayPal |
| Email | Brevo (SendInBlue) |
| AI | OpenRouter |

### Code Standards

- Maximum component file: 300 lines (current violations: ActiveReading.tsx ~900, AdminBlog.tsx ~800)
- No `any` types except external untyped libraries
- Functional components only
- Custom hooks for reusable logic
- Props interfaces named `ComponentNameProps`

### Performance Targets

| Metric | Target |
|--------|--------|
| LCP | < 2.5s |
| FID | < 100ms |
| CLS | < 0.1 |
| API response | < 500ms (excluding AI) |
| AI interpretation | < 10s |
| Lighthouse score | [TO FILL] ___/100 |

### Testing Strategy [TO FILL]

- Unit test coverage target: ___% (suggested: 80%)
- Integration tests: Yes / No
- E2E tests: Yes / No (Playwright ready)
- Test framework: [TO FILL] Vitest / Jest

---

## Development Process

### Version Control

- Main branch: `main`
- Feature branches: `feature/<name>`
- Hotfix branches: `hotfix/<name>`
- [TO FILL] Commit conventions: Conventional Commits / Free-form

### Deployment

- Hosting: Render (Frankfurt EU)
- [TO FILL] CI/CD: GitHub Actions / Render auto-deploy / Manual
- [TO FILL] Staging environment: Yes / No / Planned
- [TO FILL] Deploy frequency: On merge / Scheduled / Manual

### Code Review

- [TO FILL] Required for: All changes / Features only / Critical paths only
- [TO FILL] Approvers needed: 1 / 2 / Self-review okay

---

## Data & Compliance

### Data Retention [TO FILL]

| Data Type | Retention |
|-----------|-----------|
| Reading history | Forever / ___ months / User-controlled |
| Transaction records | ___ years (legal minimum varies) |
| Account data after deletion | ___ days |

### Compliance Requirements

**Active:**
- GDPR (EU data residency, privacy policy, cookie consent, DSAR support)

**[TO FILL] Additional:**
- CCPA compliance needed: Yes / No
- SOC 2: Yes / No / Planned
- Other regional requirements: ___

### Third-Party Data

- Analytics: [TO FILL] Google Analytics / Plausible / None
- Marketing pixels: [TO FILL] Yes / No
- Data sold: Never (non-negotiable)

---

## User Support [TO FILL]

| Item | Value |
|------|-------|
| Support email | ___ |
| Response SLA | ___ hours |
| Help documentation | Yes / No / Planned |
| FAQ location | /faq (exists) |

---

## Error Monitoring [TO FILL]

- Error tracking: Sentry / LogRocket / None / ___
- Alerting channel: Email / Slack / PagerDuty / ___
- On-call rotation: Yes / No

---

## Scalability Targets [TO FILL]

| Metric | Target |
|--------|--------|
| Monthly active users | ___ |
| Peak concurrent users | ___ |
| Database size (1 year) | ___ GB |

---

## Accessibility Standards

**Committed (WCAG 2.1 AA):**
- Color contrast: 4.5:1 text, 3:1 UI
- Keyboard navigation complete
- Screen reader compatible
- Focus indicators visible
- Form labels associated

**[TO FILL] Enhanced:**
- Reduced motion support: Yes / Planned / No
- High contrast mode: Yes / Planned / No
- Target level: AA / AAA

---

## Priority Ranking [TO FILL]

When trade-offs are necessary, rank these 1-5:

| Priority | Rank |
|----------|------|
| User experience | ___ |
| Security | ___ |
| Performance | ___ |
| Code quality | ___ |
| Feature velocity | ___ |

---

## Open Questions [TO FILL]

These need answers before detailed specifications:

### Product
1. Target age range for users: ___
2. Primary use case: Entertainment / Guidance / Self-reflection / All
3. Languages beyond EN/FR planned: ___

### Business
4. Monthly revenue target: ___
5. Break-even timeline: ___
6. Average customer LTV target: ___

### Mobile Integration
7. Web readings accessible from mobile app: Yes / No / Limited
8. Shared credit pool: Yes / No
9. Mobile launch target: ___

### Safety
10. Crisis detection keywords to implement: ___
11. Response to crisis detection: Show resources / Redirect / Flag for review

---

## Living Document

This constitution evolves as the product matures. Updates require:

- Clear rationale for change
- Consideration of impact on existing features
- Documentation of what changed and why

---

## Revision History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | January 2026 | Initial constitution | Team |
| 1.1 | 2026-01-08 | Added technical standards, compliance, open questions | Claude |

---

*Last updated: 2026-01-08*
