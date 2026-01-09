# Changelog

All notable changes to MysticOracle.

## [Unreleased]

### Added
- AdminTarotArticles management interface with list view, filters, and search
- Tarot articles trash system with soft delete, restore, and permanent delete
- Admin preview endpoint for DRAFT tarot articles
- View mode toggle (Active/Trash) in AdminTarotArticles
- Trash view with restore and permanent delete actions
- Empty trash bulk action
- Tarot article validation system with content quality checks
- Snake_case to camelCase JSON conversion for article imports
- Import Article edit mode with pre-filled data
- Preview button with modal for article visualization before importing
- Collapsible warnings toggle in validation results
- Tarot article meta-prompt (v3.0) compatible with backend validation
- Spec-Kit documentation structure (.specify/)
- Project status and tech debt tracking (docs/)
- Transaction history in user profile
- All 6 spread types documented in FAQ
- Claude agents and commands (.claude/)

### Changed
- ImportArticle UI redesigned (removed sidebar, buttons in header, removed "Editing Article" banner)
- TarotArticlePage now supports admin preview mode with `previewId` prop
- Preview icon now shows for ALL articles (not just PUBLISHED)
- Delete action now moves articles to trash (soft delete) instead of permanent deletion
- Prisma schema updated with `deletedAt` and `originalSlug` fields for trash system
- FAQ validation relaxed to allow contextual phrases ("In love readings...")
- Em dash validation excludes blockquotes (acceptable in quotes)
- Em dash validation changed from blocking error to warning
- Image URL validation relaxed (accepts placeholders with warning)
- Follow-up questions now 2 per 1 credit
- Credit deduction moved to backend only
- CLAUDE.md updated with Spec-Kit references
- Welcome and low credits modals now show once per session (sessionStorage)

### Fixed
- TarotArticlePage back button navigation error
- DRAFT article preview now works via admin preview endpoint
- Duplicate FAQ rendering (removed from content HTML, displayed only as styled section)
- Repeated modal popups (welcome modal, low credits warning)
- Flickering image thumbnails in AdminTarotArticles list
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
