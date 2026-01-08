# Changelog

All notable changes to MysticOracle.

## [Unreleased]

### Added
- Spec-Kit documentation structure (.specify/)
- Project status and tech debt tracking (docs/)
- Transaction history in user profile
- All 6 spread types documented in FAQ
- Claude agents and commands (.claude/)

### Changed
- Follow-up questions now 2 per 1 credit
- Credit deduction moved to backend only
- CLAUDE.md updated with Spec-Kit references

### Fixed
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
