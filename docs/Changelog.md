# Changelog

All notable changes to MysticOracle.

## [Unreleased]

### Added
- AdminTarotArticles management interface with list view, filters, and search
- Tarot article validation system with content quality checks
- Snake_case to camelCase JSON conversion for article imports
- Import Article edit mode with pre-filled data
- Tarot article meta-prompt (v3.0) compatible with backend validation
- Spec-Kit documentation structure (.specify/)
- Project status and tech debt tracking (docs/)
- Transaction history in user profile
- All 6 spread types documented in FAQ
- Claude agents and commands (.claude/)

### Changed
- Em dash validation changed from blocking error to warning
- Image URL validation relaxed (accepts placeholders with warning)
- Follow-up questions now 2 per 1 credit
- Credit deduction moved to backend only
- CLAUDE.md updated with Spec-Kit references

### Fixed
- API route URLs in ImportArticle component (removed duplicate /api prefix)
- Validation error message format (using errorMessages instead of raw Zod errors)
- Response handling for non-200 status codes in validation endpoint
- Double credit deduction bug
- 0-card readings being saved
- Reading history not persisting interpretation
- Follow-up questions not saving to backend
- Horoscope error messages now specific

---

## [1.0.0] - January 2026

### Added
- Initial production release
- Tarot readings with 6 spread types
- AI interpretations via OpenRouter
- Daily horoscope per zodiac sign
- Blog CMS with visual/markdown editors
- Credit economy system
- Stripe and PayPal payments
- Admin dashboard
- Multi-language support (EN/FR)
- Clerk authentication
- GDPR compliance (privacy, cookies, terms)

### Infrastructure
- React 19 + TypeScript frontend
- Express.js + Prisma backend
- PostgreSQL on Render (Frankfurt EU)
- Clerk webhooks for user sync
- Stripe/PayPal webhooks for payments
