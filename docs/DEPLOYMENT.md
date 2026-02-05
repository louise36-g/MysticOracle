# MysticOracle Deployment Guide

> Complete guide for deploying MysticOracle to production on Render.

---

## Overview

MysticOracle is deployed on **Render** (Frankfurt, EU region) with:
- **Frontend**: Static site (Vite build)
- **Backend**: Node.js web service
- **Database**: PostgreSQL managed database

---

## Architecture

```
                    ┌─────────────────┐
                    │   Cloudflare    │
                    │   (DNS/CDN)     │
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
    ┌─────▼─────┐      ┌─────▼─────┐     ┌──────▼──────┐
    │  Frontend │      │  Backend  │     │  PostgreSQL │
    │  Static   │◄────►│  Express  │◄───►│  Database   │
    │  Site     │      │  API      │     │             │
    └───────────┘      └─────┬─────┘     └─────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
        ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐
        │   Clerk   │  │  Stripe   │  │ OpenRouter│
        │   Auth    │  │  Payments │  │   AI API  │
        └───────────┘  └───────────┘  └───────────┘
```

---

## Prerequisites

Before deploying, ensure you have:

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **External Services**:
   - Clerk account with application
   - Stripe account with API keys
   - PayPal developer account (optional)
   - OpenRouter API key
   - Brevo (SendInBlue) account for emails
   - Sentry account for error tracking (recommended)

---

## Environment Variables

### Backend (Required)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db?sslmode=require` |
| `CLERK_SECRET_KEY` | Clerk API secret key | `sk_live_xxxxx` |
| `FRONTEND_URL` | Frontend URL for CORS | `https://mysticoracle.com` |
| `STRIPE_SECRET_KEY` | Stripe API secret key | `sk_live_xxxxx` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | `whsec_xxxxx` |
| `OPENROUTER_API_KEY` | OpenRouter API key | `sk-or-xxxxx` |
| `BREVO_API_KEY` | Brevo email API key | `xkeysib-xxxxx` |

### Backend (Optional)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `production` |
| `SENTRY_DSN` | Sentry error tracking DSN | - |
| `PAYPAL_CLIENT_ID` | PayPal client ID | - |
| `PAYPAL_CLIENT_SECRET` | PayPal secret | - |
| `PAYPAL_MODE` | `sandbox` or `live` | `live` |
| `ADMIN_BOOTSTRAP_KEY` | One-time admin setup key | - |
| `SITE_URL` | Full site URL for SEO | `https://mysticoracle.com` |

### Frontend (Required)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | `pk_live_xxxxx` |
| `VITE_API_URL` | Backend API URL | `https://api.mysticoracle.com` |

### Frontend (Optional)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_DEV_MODE` | Bypass credit checks | `false` |

---

## Render Setup

### 1. Create PostgreSQL Database

1. Go to Render Dashboard → **New** → **PostgreSQL**
2. Configure:
   - **Name**: `mysticoracle-db`
   - **Region**: Frankfurt (EU Central)
   - **Plan**: Starter ($7/month) or higher
3. Wait for database to provision
4. Copy the **Internal Database URL** (for web service connection)

### 2. Create Backend Web Service

1. Go to Render Dashboard → **New** → **Web Service**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `mysticoracle-api`
   - **Region**: Frankfurt (EU Central)
   - **Root Directory**: `server`
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build && npx prisma generate && npx prisma db push`
   - **Start Command**: `npm start`
4. Add environment variables (see above)
5. Click **Create Web Service**

### 3. Create Frontend Static Site

1. Go to Render Dashboard → **New** → **Static Site**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `mysticoracle`
   - **Root Directory**: `.` (root)
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Add environment variables
5. Configure redirects (see Routing section)
6. Click **Create Static Site**

---

## Build Commands

### Backend

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Build TypeScript
npm run build

# Start server
npm start
```

### Frontend

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Output directory: dist/
```

---

## Database Migrations

### Initial Setup

```bash
cd server
npx prisma db push
```

### Running Migrations

```bash
# Create migration
npx prisma migrate dev --name description_of_changes

# Apply in production
npx prisma migrate deploy
```

### Seeding Data

```bash
# Seed year energy data for birth cards
npm run seed:year-energy
```

---

## Health Checks

### Endpoint

```
GET /api/v1/health
```

### Response

```json
{
  "status": "healthy",
  "timestamp": "2026-02-05T12:00:00.000Z",
  "services": {
    "database": "connected",
    "api": "running"
  }
}
```

### Render Configuration

Configure health check in Render:
- **Path**: `/api/v1/health`
- **Interval**: 30 seconds
- **Timeout**: 10 seconds

---

## Webhook Configuration

### Stripe Webhooks

1. Go to Stripe Dashboard → **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Configure:
   - **URL**: `https://api.mysticoracle.com/webhooks/stripe`
   - **Events**:
     - `checkout.session.completed`
     - `charge.refunded`
4. Copy signing secret to `STRIPE_WEBHOOK_SECRET`

### Clerk Webhooks

1. Go to Clerk Dashboard → **Webhooks**
2. Add endpoint:
   - **URL**: `https://api.mysticoracle.com/webhooks/clerk`
   - **Events**:
     - `user.created`
     - `user.updated`
     - `user.deleted`
3. Copy signing secret to `CLERK_WEBHOOK_SECRET`

### PayPal Webhooks (Optional)

1. Go to PayPal Developer Dashboard → **Webhooks**
2. Add webhook:
   - **URL**: `https://api.mysticoracle.com/webhooks/paypal`
   - **Events**: `PAYMENT.CAPTURE.COMPLETED`

---

## SPA Routing

For React Router to work, configure redirects in Render:

**File**: Create `_redirects` in `public/` directory:

```
/*    /index.html   200
```

Or configure in Render Static Site settings:
- **Rewrite rules**: `/*` → `/index.html` (200)

---

## Environment Validation

The backend validates environment variables at startup:

**Required (all environments)**:
- `DATABASE_URL`
- `CLERK_SECRET_KEY`

**Required (production only)**:
- `FRONTEND_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `OPENROUTER_API_KEY`
- `BREVO_API_KEY`

**Recommended (warnings if missing)**:
- `SENTRY_DSN`

If required variables are missing, the server exits with an error message.

---

## Monitoring

### Sentry Error Tracking

1. Create Sentry project at [sentry.io](https://sentry.io)
2. Get DSN from **Project Settings** → **Client Keys**
3. Add `SENTRY_DSN` to environment variables

**Features**:
- Automatic error capture
- Performance monitoring (10% sample rate)
- User context tracking
- Filters out expected errors (404s)

### Log Monitoring

Render provides built-in logging:
- Go to **Service** → **Logs**
- Filter by timestamp, level, or search text

**Log Format**:
```
[ErrorHandler] { path, method, error, code }
[Reading API] Validation failed: ...
[CreditService] Added X credits to user_Y
```

### Database Monitoring

Monitor via Render Dashboard:
- Connection count
- Storage usage
- Query performance

---

## Scaling

### Backend Scaling

1. Go to Render Dashboard → **Service** → **Settings**
2. Increase **Instance Type** (Starter → Standard → Pro)
3. Add **Auto-scaling** (available on paid plans)

### Database Scaling

1. Go to Render Dashboard → **Database** → **Settings**
2. Upgrade plan for more connections and storage

### Caching

The backend uses NodeCache for in-memory caching:
- Translation strings (5 min TTL)
- Horoscope data (24 hour TTL)
- Rate limit counters

---

## Rollback Procedures

### Backend Rollback

1. Go to Render Dashboard → **Service** → **Deploys**
2. Find the previous working deploy
3. Click **Redeploy**

Or use Git:
```bash
git revert HEAD
git push origin main
```

### Database Rollback

**Caution**: Database rollbacks may cause data loss.

1. Restore from automatic backup (Render paid plans)
2. Or manually restore from backup:

```bash
# Create backup before changes
pg_dump $DATABASE_URL > backup.sql

# Restore from backup
psql $DATABASE_URL < backup.sql
```

### Feature Flags

For safer rollouts, use environment variables as feature flags:

```typescript
if (process.env.FEATURE_NEW_PAYMENT === 'true') {
  // New payment flow
} else {
  // Old payment flow
}
```

---

## Security Checklist

Before deploying to production:

- [ ] All secrets in environment variables (not in code)
- [ ] `NODE_ENV=production` set
- [ ] HTTPS enforced (Render handles this)
- [ ] CORS configured for frontend domain only
- [ ] Rate limiting enabled
- [ ] Webhook signatures verified
- [ ] Admin bootstrap key set (then remove after use)
- [ ] Sentry DSN configured
- [ ] Database SSL required (`?sslmode=require`)

---

## Troubleshooting

### Build Failures

**Problem**: `prisma generate` fails

**Solution**: Ensure `prisma` is in `devDependencies` and `@prisma/client` in `dependencies`:
```bash
npm install --save-dev prisma
npm install @prisma/client
```

**Problem**: TypeScript errors

**Solution**: Run type check locally first:
```bash
npx tsc --noEmit
```

### Runtime Errors

**Problem**: Database connection refused

**Solution**:
- Check `DATABASE_URL` is correct
- Ensure `?sslmode=require` is appended
- Verify database is running in Render Dashboard

**Problem**: Authentication errors

**Solution**:
- Verify `CLERK_SECRET_KEY` matches Clerk dashboard
- Check webhook secrets are correctly copied
- Ensure frontend uses matching `CLERK_PUBLISHABLE_KEY`

**Problem**: Payment webhooks not received

**Solution**:
- Verify webhook URL is correct in Stripe/PayPal dashboard
- Check webhook signing secret matches environment variable
- Review Stripe webhook logs for delivery status

### Performance Issues

**Problem**: Slow API responses

**Solution**:
- Check database query performance in Render metrics
- Review N+1 query issues with Prisma
- Add caching for frequently accessed data

**Problem**: High memory usage

**Solution**:
- Increase instance size in Render
- Review for memory leaks
- Reduce cache sizes if needed

---

## Bootstrap Admin Access

For first-time setup, grant admin access to a user:

1. Set `ADMIN_BOOTSTRAP_KEY` environment variable
2. Sign in as the user who should be admin
3. Make POST request:

```bash
curl -X POST https://api.mysticoracle.com/api/v1/health/bootstrap \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{"key": "your-bootstrap-key"}'
```

4. Remove `ADMIN_BOOTSTRAP_KEY` after use for security

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests pass (`npm test`)
- [ ] Type check passes (`npx tsc --noEmit`)
- [ ] Lint passes (`npm run lint`)
- [ ] Build succeeds locally (`npm run build`)
- [ ] Database migrations tested locally
- [ ] Environment variables documented

### During Deployment

- [ ] Monitor Render deploy logs
- [ ] Check health endpoint after deploy
- [ ] Verify webhook connectivity
- [ ] Test critical user flows (sign in, purchase, reading)

### Post-Deployment

- [ ] Monitor Sentry for new errors
- [ ] Check performance metrics
- [ ] Verify database connections stable
- [ ] Test payment flows in production

---

## Changelog

| Date | Change |
|------|--------|
| 2026-02 | Initial deployment documentation |
