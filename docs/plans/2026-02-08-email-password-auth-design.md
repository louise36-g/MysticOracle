# Email + Password Authentication Design

**Date:** 2026-02-08
**Status:** Approved

## Overview

Add traditional email + password registration alongside existing Google/Facebook social logins. Username is collected after sign-up in the welcome flow.

## Goals

1. Allow users to register with email + password (not just verification codes)
2. Maintain social login options (Google, Facebook) with equal prominence
3. Collect username after sign-up via welcome modal
4. Match MysticOracle's mystical visual theme throughout

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auth provider | Keep Clerk | Already integrated, supports password auth |
| Sign-up UI | Custom pages | Better branding, dedicated URLs for marketing |
| Username collection | Welcome modal | Reduces sign-up friction, consistent for all auth methods |
| Layout | Equal prominence | Social buttons + password form both visible |

## Implementation

### 1. New Pages

#### `/sign-up` - SignUpPage.tsx

```
┌─────────────────────────────────────────────┐
│  [Mystical starfield background]            │
│                                             │
│     ✨ Begin Your Journey                   │
│     The cards await your presence           │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  [Continue with Google]              │   │
│  │  [Continue with Facebook]            │   │
│  │  ──────── or ────────               │   │
│  │  Email: [_______________]            │   │
│  │  Password: [_______________]         │   │
│  │  [Create Account]                    │   │
│  └─────────────────────────────────────┘   │
│                                             │
│     Already have an account? Sign in →      │
└─────────────────────────────────────────────┘
```

- Full-screen layout with cosmic/mystical background
- Clerk's `<SignUp />` component with custom appearance
- Themed to match MysticOracle aesthetic
- Link to `/sign-in` at bottom

#### `/sign-in` - SignInPage.tsx

Same layout as sign-up, using Clerk's `<SignIn />` component.
- Link to `/sign-up` at bottom
- "Forgot password?" handled by Clerk automatically

### 2. Header Changes

**Current:**
```tsx
<SignInButton mode="modal">
  <button>Sign In</button>
</SignInButton>
```

**New:**
```tsx
<Link to="/sign-in">
  <button>Sign In</button>
</Link>
```

### 3. Welcome Modal - Username Step

Add new Step 0 before existing steps (only shown when username is missing or auto-generated):

```
┌─────────────────────────────────────────┐
│                  ✨                      │
│       Choose Your Mystical Name          │
│                                          │
│   This is how you'll be known in the    │
│   realm of the cards                     │
│                                          │
│   [____________________]                 │
│                                          │
│   ✓ Available                            │
│                                          │
│            [ Continue → ]                │
└─────────────────────────────────────────┘
```

**Logic:**
- Check if username starts with `user_` (auto-generated) or is empty
- If so, show username step first
- Validate: 3-20 chars, alphanumeric + underscore
- Check availability via API before allowing continue
- Save username before proceeding to next step

### 4. Backend API Changes

#### Update PATCH /api/v1/users/me

**Current fields:** `language`, `welcomeCompleted`
**Add:** `username`

```typescript
// Validation
const updateSchema = z.object({
  language: z.enum(['en', 'fr']).optional(),
  welcomeCompleted: z.boolean().optional(),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores')
    .optional(),
});
```

**Username update logic:**
1. Validate format
2. Check uniqueness (case-insensitive)
3. Check not reserved word
4. Update user record

**Error responses:**
- `400` - Invalid format
- `409` - Username already taken

#### New: GET /api/v1/users/check-username

```
GET /api/v1/users/check-username?username=luna_star
```

**Response:**
```json
{ "available": true }
// or
{ "available": false, "reason": "already_taken" }
```

**Rate limiting:** 10 requests per minute (prevent enumeration)

### 5. Routes Configuration

Add to `routes/index.tsx`:

```tsx
{ path: '/sign-up', element: <SignUpPage /> },
{ path: '/sign-in', element: <SignInPage /> },
```

These should be public routes (no ProtectedRoute wrapper).

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `components/auth/SignUpPage.tsx` | Create | New sign-up page |
| `components/auth/SignInPage.tsx` | Create | New sign-in page |
| `components/auth/AuthLayout.tsx` | Create | Shared layout with background |
| `components/WelcomeModal.tsx` | Modify | Add username collection step |
| `components/Header.tsx` | Modify | Replace modal with link |
| `routes/index.tsx` | Modify | Add new routes |
| `routes/routes.ts` | Modify | Add SIGN_UP, SIGN_IN constants |
| `server/src/routes/users/profile.ts` | Modify | Add username update + check endpoint |

## Clerk Appearance Tokens

To match MysticOracle theme:

```typescript
appearance={{
  variables: {
    colorPrimary: '#f59e0b', // amber-500
    colorBackground: '#0f172a', // slate-900
    colorText: '#fef3c7', // amber-100
    colorTextSecondary: '#94a3b8', // slate-400
    borderRadius: '0.75rem',
  },
  elements: {
    card: 'bg-slate-900/80 border border-purple-500/30 backdrop-blur',
    headerTitle: 'text-amber-100 font-heading',
    headerSubtitle: 'text-slate-400',
    socialButtonsBlockButton: 'border-slate-700 hover:bg-slate-800',
    formFieldInput: 'bg-slate-800 border-slate-700 text-white',
    formButtonPrimary: 'bg-gradient-to-r from-purple-600 to-amber-600',
    footerActionLink: 'text-amber-400 hover:text-amber-300',
  }
}}
```

## Testing Checklist

- [ ] Sign up with email + password works
- [ ] Sign up with Google still works
- [ ] Sign up with Facebook still works
- [ ] Sign in with password works
- [ ] Sign in with social still works
- [ ] Username step appears for new users
- [ ] Username step skipped if username exists (from social)
- [ ] Username validation works (too short, invalid chars)
- [ ] Username availability check works
- [ ] Duplicate username rejected
- [ ] Mobile responsive layout
- [ ] French translations work

## Security Considerations

1. **Password requirements** - Handled by Clerk (configurable in dashboard)
2. **Rate limiting** - Username check endpoint limited to 10/min
3. **Username enumeration** - Rate limiting + generic error messages
4. **Reserved usernames** - Block: admin, support, help, system, etc.
5. **SQL injection** - Prisma parameterized queries
6. **XSS** - React escapes output by default
