---
name: mystic-oracle-context
description: Understand MysticOracle project context, architecture, and conventions. Use when starting work on MysticOracle, needing project overview, or understanding how components fit together.
---

# MysticOracle Project Context

Quick reference for MysticOracle development.

## Project Overview

MysticOracle is a web-based tarot reading platform with:
- AI-powered tarot interpretations
- Daily horoscopes
- Blog CMS
- Credit economy
- Admin dashboard

It also serves as a funnel to the AI Tarot Saga mobile game.

## Key Files to Read

When starting work, read these files:
1. `CLAUDE.md` - Project guide and conventions
2. `Architecture.md` - System design
3. `.specify/specs/001-mystic-oracle/spec.md` - Feature specification
4. `docs/Project_status.md` - Current progress
5. `docs/Tech_debt.md` - Known issues

## Tech Stack

### Frontend
- React 19 + TypeScript + Vite
- Tailwind CSS + Framer Motion
- Clerk for auth
- Context API for state

### Backend
- Express.js + TypeScript
- Prisma + PostgreSQL
- Clerk JWT verification
- Stripe + PayPal payments

## Architecture Quick Reference

```
Frontend (Vite :5173)
    ↓ API calls via apiService.ts
Backend (Express :3001)
    ↓ Prisma ORM
PostgreSQL (Render Frankfurt)
```

## Key Conventions

### Frontend
- Functional components only
- API calls through `services/apiService.ts`
- Global state in `context/AppContext.tsx`
- Translations for user-facing strings

### Backend
- Routes in `server/src/routes/`
- Auth middleware: `requireAuth`, `requireAdmin`
- Zod for request validation
- Credits deducted here, not frontend

### Credit System
- 3 credits on signup
- 2 credits daily bonus (+5 streak)
- Backend deducts when saving reading
- Frontend only validates availability

## Spread Types and Costs

| Spread | Cards | Credits |
|--------|-------|---------|
| Single Card | 1 | 1 |
| Three Card | 3 | 3 |
| Love | 5 | 5 |
| Career | 5 | 5 |
| Horseshoe | 7 | 7 |
| Celtic Cross | 10 | 10 |

Follow-up questions: 2 questions per 1 credit

## Common Tasks

### Adding a new feature
1. Check `spec.md` for requirements
2. Update relevant components
3. Add API endpoint if needed
4. Update types in `types.ts`
5. Test both EN and FR
6. Update docs

### Fixing a bug
1. Use systematic-debugging skill
2. Check `Tech_debt.md` for known issues
3. Fix in minimal scope
4. Update `Tech_debt.md` if resolved

### Working on admin
1. Check `isAdmin` flag requirement
2. Use `requireAdmin` middleware
3. Test with admin account ("Mooks")

## Development Commands

```bash
# Frontend
npm run dev          # Start frontend (5173)
npx tsc --noEmit     # Type check

# Backend
cd server
npm run dev          # Start backend (3001)
npx prisma studio    # Database GUI
npx prisma generate  # Regenerate client
```

## Environment Variables

Frontend needs: `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_API_URL`
Backend needs: `DATABASE_URL`, `CLERK_SECRET_KEY`, `STRIPE_SECRET_KEY`

## Current Phase

**Phase 1: Stabilization** - Fix bugs, reduce tech debt, prepare for mobile integration.

See `docs/Project_status.md` for detailed progress.
