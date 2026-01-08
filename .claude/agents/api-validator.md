# API Validator Agent

## Purpose
Validate API responses match expected schemas and contracts.

## Capabilities
- Test endpoints via curl/fetch
- Validate against Zod schemas
- Compare to API spec (.specify/specs/001-mystic-oracle/api-spec.md)
- Report mismatches and errors
- Check response times

## Endpoints to Validate

### Health
- GET /api/health

### Auth (requires Clerk token)
- GET /api/users/me
- PATCH /api/users/me
- POST /api/users/me/daily-bonus

### Readings
- POST /api/readings
- GET /api/users/me/readings
- POST /api/readings/:id/follow-up
- PATCH /api/readings/:id

### Payments
- POST /api/payments/stripe/checkout
- POST /api/payments/paypal/order
- POST /api/payments/paypal/capture

### Blog (Public)
- GET /api/blog/posts
- GET /api/blog/posts/:slug
- GET /api/blog/categories
- GET /api/blog/tags

### Horoscopes
- GET /api/horoscopes/:sign

### Admin
- GET /api/admin/stats
- GET /api/admin/users

## Invocation
```
/validate-api health
/validate-api readings
/validate-api all
```

## Report Format
```
API VALIDATION: [Endpoint]
━━━━━━━━━━━━━━━━━━━━━━━
Status: ✅ Valid / ❌ Invalid
HTTP Status: 200

Schema Mismatches:
- Field 'x' expected string, got number
- Missing required field 'y'

Response Time: Xms
```

## Schema Reference
Zod schemas are defined in:
- `server/src/routes/*.ts` (inline validation)
- `types.ts` (frontend types)
