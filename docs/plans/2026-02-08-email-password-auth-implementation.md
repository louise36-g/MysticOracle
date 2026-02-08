# Email + Password Authentication Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add custom sign-up and sign-in pages with email+password authentication, and collect usernames via the welcome modal.

**Architecture:** Create themed auth pages using Clerk's `<SignUp />` and `<SignIn />` components with custom styling. Add a username collection step to the existing welcome modal. Update backend to support username changes and availability checks.

**Tech Stack:** React, Clerk (@clerk/clerk-react), Tailwind CSS, Framer Motion, Express, Prisma, Zod

---

## Task 1: Add Route Constants

**Files:**
- Modify: `routes/routes.ts`

**Step 1: Add auth route constants**

Add to the ROUTES object after the `PROFILE` line:

```typescript
// Auth
SIGN_UP: '/sign-up',
SIGN_IN: '/sign-in',
PROFILE: '/profile',
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add routes/routes.ts
git commit -m "feat(auth): add sign-up and sign-in route constants"
```

---

## Task 2: Create Auth Layout Component

**Files:**
- Create: `components/auth/AuthLayout.tsx`

**Step 1: Create the shared auth layout**

```tsx
import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { ROUTES } from '../../routes/routes';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Mystical background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-purple-950/50 to-slate-950" />
      <div className="absolute inset-0 bg-[url('/stars-bg.svg')] opacity-30" />

      {/* Animated orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <Link to={ROUTES.HOME} className="flex items-center justify-center gap-2 mb-8">
          <img
            src="/logos/celestiarcana-comet-cream.svg"
            alt="CelestiArcana"
            className="h-12 w-auto"
          />
          <span className="text-2xl font-heading font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-100 to-purple-200">
            CelestiArcana
          </span>
        </Link>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h1 className="text-2xl font-heading text-amber-100">{title}</h1>
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-slate-400">{subtitle}</p>
        </div>

        {/* Clerk component container */}
        <div className="bg-slate-900/80 backdrop-blur border border-purple-500/30 rounded-2xl p-6 shadow-2xl shadow-purple-500/10">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
```

**Step 2: Verify file created and TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add components/auth/AuthLayout.tsx
git commit -m "feat(auth): create shared AuthLayout component with mystical styling"
```

---

## Task 3: Create Sign-Up Page

**Files:**
- Create: `components/auth/SignUpPage.tsx`

**Step 1: Create the sign-up page**

```tsx
import React from 'react';
import { SignUp } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../routes/routes';
import AuthLayout from './AuthLayout';
import { useApp } from '../../context/AppContext';

const clerkAppearance = {
  variables: {
    colorPrimary: '#a855f7',
    colorBackground: 'transparent',
    colorText: '#fef3c7',
    colorTextSecondary: '#94a3b8',
    colorInputBackground: '#1e293b',
    colorInputText: '#ffffff',
    borderRadius: '0.75rem',
  },
  elements: {
    rootBox: 'w-full',
    card: 'bg-transparent shadow-none p-0',
    headerTitle: 'hidden',
    headerSubtitle: 'hidden',
    socialButtonsBlockButton: 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-white',
    socialButtonsBlockButtonText: 'text-white font-medium',
    dividerLine: 'bg-slate-700',
    dividerText: 'text-slate-500',
    formFieldLabel: 'text-slate-300',
    formFieldInput: 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-purple-500',
    formButtonPrimary: 'bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-500 hover:to-amber-500 text-white font-semibold',
    footerActionLink: 'text-amber-400 hover:text-amber-300',
    identityPreviewEditButton: 'text-amber-400 hover:text-amber-300',
    formFieldAction: 'text-amber-400 hover:text-amber-300',
    alert: 'bg-red-900/50 border-red-500/50 text-red-200',
    alertText: 'text-red-200',
  },
};

const SignUpPage: React.FC = () => {
  const { language } = useApp();

  const title = language === 'fr' ? 'Commencez votre voyage' : 'Begin Your Journey';
  const subtitle = language === 'fr'
    ? 'Les cartes attendent votre présence'
    : 'The cards await your presence';

  return (
    <AuthLayout title={title} subtitle={subtitle}>
      <SignUp
        appearance={clerkAppearance}
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        forceRedirectUrl="/"
      />
      <div className="mt-6 text-center text-sm text-slate-400">
        {language === 'fr' ? 'Déjà un compte ?' : 'Already have an account?'}{' '}
        <Link to={ROUTES.SIGN_IN} className="text-amber-400 hover:text-amber-300 font-medium">
          {language === 'fr' ? 'Se connecter' : 'Sign in'}
        </Link>
      </div>
    </AuthLayout>
  );
};

export default SignUpPage;
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add components/auth/SignUpPage.tsx
git commit -m "feat(auth): create SignUpPage with Clerk integration and mystical styling"
```

---

## Task 4: Create Sign-In Page

**Files:**
- Create: `components/auth/SignInPage.tsx`

**Step 1: Create the sign-in page**

```tsx
import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../routes/routes';
import AuthLayout from './AuthLayout';
import { useApp } from '../../context/AppContext';

const clerkAppearance = {
  variables: {
    colorPrimary: '#a855f7',
    colorBackground: 'transparent',
    colorText: '#fef3c7',
    colorTextSecondary: '#94a3b8',
    colorInputBackground: '#1e293b',
    colorInputText: '#ffffff',
    borderRadius: '0.75rem',
  },
  elements: {
    rootBox: 'w-full',
    card: 'bg-transparent shadow-none p-0',
    headerTitle: 'hidden',
    headerSubtitle: 'hidden',
    socialButtonsBlockButton: 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-white',
    socialButtonsBlockButtonText: 'text-white font-medium',
    dividerLine: 'bg-slate-700',
    dividerText: 'text-slate-500',
    formFieldLabel: 'text-slate-300',
    formFieldInput: 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-purple-500',
    formButtonPrimary: 'bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-500 hover:to-amber-500 text-white font-semibold',
    footerActionLink: 'text-amber-400 hover:text-amber-300',
    identityPreviewEditButton: 'text-amber-400 hover:text-amber-300',
    formFieldAction: 'text-amber-400 hover:text-amber-300',
    alert: 'bg-red-900/50 border-red-500/50 text-red-200',
    alertText: 'text-red-200',
  },
};

const SignInPage: React.FC = () => {
  const { language } = useApp();

  const title = language === 'fr' ? 'Bon retour' : 'Welcome Back';
  const subtitle = language === 'fr'
    ? 'Les mystères vous attendent'
    : 'The mysteries await you';

  return (
    <AuthLayout title={title} subtitle={subtitle}>
      <SignIn
        appearance={clerkAppearance}
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        forceRedirectUrl="/"
      />
      <div className="mt-6 text-center text-sm text-slate-400">
        {language === 'fr' ? 'Pas encore de compte ?' : "Don't have an account?"}{' '}
        <Link to={ROUTES.SIGN_UP} className="text-amber-400 hover:text-amber-300 font-medium">
          {language === 'fr' ? "S'inscrire" : 'Sign up'}
        </Link>
      </div>
    </AuthLayout>
  );
};

export default SignInPage;
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add components/auth/SignInPage.tsx
git commit -m "feat(auth): create SignInPage with Clerk integration and mystical styling"
```

---

## Task 5: Create Auth Index Export

**Files:**
- Create: `components/auth/index.ts`

**Step 1: Create barrel export**

```typescript
export { default as AuthLayout } from './AuthLayout';
export { default as SignUpPage } from './SignUpPage';
export { default as SignInPage } from './SignInPage';
```

**Step 2: Commit**

```bash
git add components/auth/index.ts
git commit -m "feat(auth): add barrel export for auth components"
```

---

## Task 6: Add Auth Routes

**Files:**
- Modify: `routes/index.tsx`

**Step 1: Add imports at top of file (after other imports around line 7)**

```typescript
import { SignUpPage, SignInPage } from '../components/auth';
```

**Step 2: Add auth routes in Public Routes section (after HOME route, around line 127)**

Add these routes:

```typescript
// Auth routes
{
  path: ROUTES.SIGN_UP,
  element: <SignUpPage />,
},
{
  path: ROUTES.SIGN_IN,
  element: <SignInPage />,
},
```

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add routes/index.tsx
git commit -m "feat(auth): add sign-up and sign-in routes"
```

---

## Task 7: Update Header to Use Links Instead of Modal

**Files:**
- Modify: `components/Header.tsx`

**Step 1: Update imports - remove SignInButton, keep others (line 3)**

Change:
```typescript
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/clerk-react';
```

To:
```typescript
import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/clerk-react';
```

**Step 2: Replace desktop SignInButton (lines 124-130)**

Change:
```tsx
<SignedOut>
  <SignInButton mode="modal">
    <Button variant="primary" size="sm">
      {language === 'fr' ? 'Connexion' : 'Sign In'}
    </Button>
  </SignInButton>
</SignedOut>
```

To:
```tsx
<SignedOut>
  <Link to={ROUTES.SIGN_IN}>
    <Button variant="primary" size="sm">
      {language === 'fr' ? 'Connexion' : 'Sign In'}
    </Button>
  </Link>
</SignedOut>
```

**Step 3: Replace mobile SignInButton (lines 277-285)**

Change:
```tsx
<SignedOut>
  <div className="pt-2">
    <SignInButton mode="modal">
      <Button className="w-full" variant="primary">
        {language === 'fr' ? 'Connexion' : 'Sign In'}
      </Button>
    </SignInButton>
  </div>
</SignedOut>
```

To:
```tsx
<SignedOut>
  <div className="pt-2">
    <Link to={ROUTES.SIGN_IN} onClick={closeMobileMenu}>
      <Button className="w-full" variant="primary">
        {language === 'fr' ? 'Connexion' : 'Sign In'}
      </Button>
    </Link>
  </div>
</SignedOut>
```

**Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add components/Header.tsx
git commit -m "feat(auth): replace sign-in modal with link to sign-in page"
```

---

## Task 8: Add Backend Username Check Endpoint

**Files:**
- Modify: `server/src/routes/users/profile.ts`

**Step 1: Add username check endpoint before the credits endpoint**

Add this route after the PATCH /me route (around line 94):

```typescript
// ============================================
// USERNAME AVAILABILITY CHECK
// ============================================

// Check if username is available
router.get('/check-username', async (req, res) => {
  try {
    const { username } = req.query;

    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Validate format
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        available: false,
        reason: 'invalid_format',
        message: 'Username must be 3-20 characters, letters, numbers, and underscores only'
      });
    }

    // Check reserved usernames
    const reserved = ['admin', 'administrator', 'support', 'help', 'system', 'celestiarcana', 'moderator', 'mod'];
    if (reserved.includes(username.toLowerCase())) {
      return res.status(200).json({
        available: false,
        reason: 'reserved'
      });
    }

    // Check if username exists (case-insensitive)
    const existingUser = await prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: 'insensitive',
        },
      },
    });

    res.json({
      available: !existingUser,
      reason: existingUser ? 'already_taken' : undefined
    });
  } catch (error) {
    console.error('Error checking username:', error);
    res.status(500).json({ error: 'Failed to check username' });
  }
});
```

**Step 2: Verify TypeScript compiles**

Run: `cd server && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add server/src/routes/users/profile.ts
git commit -m "feat(auth): add username availability check endpoint"
```

---

## Task 9: Update Backend to Accept Username Updates

**Files:**
- Modify: `server/src/routes/users/profile.ts`

**Step 1: Update the PATCH /me route to accept username (around line 76-94)**

Change the route handler to:

```typescript
// Update user preferences
router.patch('/me', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { language, welcomeCompleted, username } = req.body;

    // If updating username, validate it
    if (username !== undefined) {
      // Validate format
      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
      if (!usernameRegex.test(username)) {
        return res.status(400).json({
          error: 'Username must be 3-20 characters, letters, numbers, and underscores only'
        });
      }

      // Check reserved usernames
      const reserved = ['admin', 'administrator', 'support', 'help', 'system', 'celestiarcana', 'moderator', 'mod'];
      if (reserved.includes(username.toLowerCase())) {
        return res.status(400).json({ error: 'This username is reserved' });
      }

      // Check if username is taken (case-insensitive, excluding current user)
      const existingUser = await prisma.user.findFirst({
        where: {
          username: {
            equals: username,
            mode: 'insensitive',
          },
          NOT: {
            id: userId,
          },
        },
      });

      if (existingUser) {
        return res.status(409).json({ error: 'Username is already taken' });
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        language: language || undefined,
        welcomeCompleted: typeof welcomeCompleted === 'boolean' ? welcomeCompleted : undefined,
        username: username || undefined,
      },
    });

    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});
```

**Step 2: Verify TypeScript compiles**

Run: `cd server && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add server/src/routes/users/profile.ts
git commit -m "feat(auth): add username update support to PATCH /me endpoint"
```

---

## Task 10: Add Frontend API Functions for Username

**Files:**
- Modify: `services/api/user.ts`

**Step 1: Add username check function (at end of file)**

```typescript
// ============================================
// USERNAME
// ============================================

export async function checkUsernameAvailability(
  username: string
): Promise<{ available: boolean; reason?: string; message?: string }> {
  return apiRequest(`/api/v1/users/check-username?username=${encodeURIComponent(username)}`);
}

export async function updateUsername(
  token: string,
  username: string
): Promise<UserProfile> {
  return apiRequest<UserProfile>('/api/v1/users/me', {
    method: 'PATCH',
    body: { username },
    token,
  });
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add services/api/user.ts
git commit -m "feat(auth): add username check and update API functions"
```

---

## Task 11: Update Welcome Modal with Username Step

**Files:**
- Modify: `components/WelcomeModal.tsx`

**Step 1: Add imports at top of file**

Add to existing imports:

```typescript
import { User, Check, AlertCircle } from 'lucide-react';
import { checkUsernameAvailability, updateUsername } from '../services/api';
```

**Step 2: Update TOTAL_STEPS constant (line 19)**

Change:
```typescript
const TOTAL_STEPS = 3;
```

To:
```typescript
const TOTAL_STEPS = 4;
```

**Step 3: Add username state variables after existing state (around line 26)**

Add after `const [isClosing, setIsClosing] = useState(false);`:

```typescript
const [username, setUsername] = useState('');
const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
const [usernameError, setUsernameError] = useState<string | null>(null);
const [needsUsername, setNeedsUsername] = useState(false);
```

**Step 4: Add username check effect (after the state variables)**

```typescript
// Check if user needs to set username (auto-generated or missing)
React.useEffect(() => {
  const checkUsername = async () => {
    const token = await getToken();
    if (!token) return;

    // Get fresh user data to check username
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/v1/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = await response.json();

      // Check if username is auto-generated (starts with 'user_') or missing
      if (!userData.username || userData.username.startsWith('user_')) {
        setNeedsUsername(true);
      }
    } catch (error) {
      console.error('Failed to check username:', error);
    }
  };

  if (isOpen) {
    checkUsername();
  }
}, [isOpen, getToken]);
```

**Step 5: Add username validation handler (after markComplete function)**

```typescript
const validateUsername = useCallback(async (value: string) => {
  setUsername(value);
  setUsernameError(null);

  if (!value) {
    setUsernameStatus('idle');
    return;
  }

  // Basic format check
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  if (!usernameRegex.test(value)) {
    setUsernameStatus('invalid');
    setUsernameError(
      t('welcome.username.invalid_format', 'Must be 3-20 characters: letters, numbers, underscores')
    );
    return;
  }

  // Check availability
  setUsernameStatus('checking');
  try {
    const result = await checkUsernameAvailability(value);
    if (result.available) {
      setUsernameStatus('available');
    } else {
      setUsernameStatus('taken');
      setUsernameError(
        result.reason === 'reserved'
          ? t('welcome.username.reserved', 'This username is reserved')
          : t('welcome.username.taken', 'This username is already taken')
      );
    }
  } catch (error) {
    setUsernameStatus('idle');
    console.error('Failed to check username:', error);
  }
}, [t]);

const handleSaveUsername = useCallback(async () => {
  if (usernameStatus !== 'available') return;

  try {
    const token = await getToken();
    if (!token) return;

    await updateUsername(token, username);
    await onRefreshUser();
    setCurrentStep(1); // Move to next step
  } catch (error) {
    console.error('Failed to save username:', error);
    setUsernameError(t('welcome.username.save_error', 'Failed to save username. Please try again.'));
  }
}, [username, usernameStatus, getToken, onRefreshUser, t]);

const handleSkipUsername = useCallback(() => {
  setCurrentStep(1); // Skip to welcome step
}, []);
```

**Step 6: Add the username step UI (inside the AnimatePresence, before step 0)**

Add as the first step (this becomes the new step 0, existing steps shift to 1, 2, 3):

```tsx
{currentStep === 0 && needsUsername && (
  <motion.div
    key="step-username"
    custom={1}
    variants={slideVariants}
    initial="enter"
    animate="center"
    exit="exit"
    transition={{ duration: 0.3 }}
    className="flex-1 flex flex-col items-center text-center"
  >
    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6">
      <User className="w-8 h-8 text-white" />
    </div>
    <h2 className="text-2xl font-heading text-amber-100 mb-2">
      {t('welcome.username.title', 'Choose Your Mystical Name')}
    </h2>
    <p className="text-slate-400 mb-6">
      {t('welcome.username.subtitle', 'This is how you\'ll be known in the realm of the cards')}
    </p>

    <div className="w-full max-w-xs">
      <div className="relative">
        <input
          type="text"
          value={username}
          onChange={(e) => validateUsername(e.target.value)}
          placeholder={t('welcome.username.placeholder', 'Enter username...')}
          className={`w-full px-4 py-3 bg-slate-800 border rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-colors ${
            usernameStatus === 'available'
              ? 'border-green-500 focus:ring-green-500/50'
              : usernameStatus === 'taken' || usernameStatus === 'invalid'
              ? 'border-red-500 focus:ring-red-500/50'
              : 'border-slate-700 focus:ring-purple-500/50'
          }`}
          maxLength={20}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {usernameStatus === 'checking' && (
            <div className="w-5 h-5 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          )}
          {usernameStatus === 'available' && (
            <Check className="w-5 h-5 text-green-500" />
          )}
          {(usernameStatus === 'taken' || usernameStatus === 'invalid') && (
            <AlertCircle className="w-5 h-5 text-red-500" />
          )}
        </div>
      </div>

      {usernameError && (
        <p className="mt-2 text-sm text-red-400">{usernameError}</p>
      )}
      {usernameStatus === 'available' && (
        <p className="mt-2 text-sm text-green-400">
          {t('welcome.username.available', 'Username is available!')}
        </p>
      )}
    </div>

    <div className="flex gap-3 mt-8">
      <button
        onClick={handleSkipUsername}
        className="px-4 py-2 text-slate-400 hover:text-slate-300 transition-colors"
      >
        {t('welcome.username.skip', 'Skip for now')}
      </button>
      <Button
        onClick={handleSaveUsername}
        disabled={usernameStatus !== 'available'}
        className="flex items-center gap-2"
      >
        {t('welcome.username.continue', 'Continue')}
        <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  </motion.div>
)}
```

**Step 7: Update existing step conditions**

Change the existing step conditions to account for the username step:

- `currentStep === 0` becomes `currentStep === 0 && !needsUsername` OR `currentStep === 1`
- `currentStep === 1` becomes `currentStep === 2`
- `currentStep === 2` becomes `currentStep === 3`

Actually, simpler approach - adjust the step numbers:

For the existing steps, change:
- `{currentStep === 0 && (` → `{((currentStep === 0 && !needsUsername) || currentStep === 1) && (`
- `{currentStep === 1 && (` → `{currentStep === 2 && (`
- `{currentStep === 2 && (` → `{currentStep === 3 && (`

And update `handleNext`:
```typescript
const handleNext = useCallback(() => {
  if (currentStep < TOTAL_STEPS - 1) {
    setCurrentStep(prev => prev + 1);
  }
}, [currentStep]);
```

And update the final step check:
```typescript
{currentStep < TOTAL_STEPS - 1 ? (
```

**Step 8: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 9: Commit**

```bash
git add components/WelcomeModal.tsx
git commit -m "feat(auth): add username collection step to welcome modal"
```

---

## Task 12: Manual Testing Checklist

**Test the complete flow:**

1. [ ] Visit `/sign-up` - page loads with mystical styling
2. [ ] Social login buttons visible (Google, Facebook)
3. [ ] Email/password form visible
4. [ ] Sign up with email + password works
5. [ ] After sign-up, redirects to home
6. [ ] Welcome modal appears
7. [ ] Username step appears (if username is auto-generated)
8. [ ] Username validation works (too short, invalid chars)
9. [ ] Username availability check works
10. [ ] Can save username and continue
11. [ ] Can skip username step
12. [ ] Visit `/sign-in` - page loads correctly
13. [ ] Can sign in with password
14. [ ] Can sign in with social
15. [ ] Header shows "Sign In" link (not modal)
16. [ ] Mobile header shows "Sign In" link (not modal)

**Step 1: Run dev servers**

```bash
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
npm run dev
```

**Step 2: Test each item in checklist**

**Step 3: Final commit if all tests pass**

```bash
git add -A
git commit -m "feat(auth): complete email+password authentication implementation"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Add route constants | `routes/routes.ts` |
| 2 | Create AuthLayout | `components/auth/AuthLayout.tsx` |
| 3 | Create SignUpPage | `components/auth/SignUpPage.tsx` |
| 4 | Create SignInPage | `components/auth/SignInPage.tsx` |
| 5 | Create barrel export | `components/auth/index.ts` |
| 6 | Add auth routes | `routes/index.tsx` |
| 7 | Update Header | `components/Header.tsx` |
| 8 | Add username check endpoint | `server/src/routes/users/profile.ts` |
| 9 | Update PATCH /me for username | `server/src/routes/users/profile.ts` |
| 10 | Add API functions | `services/api/user.ts` |
| 11 | Update WelcomeModal | `components/WelcomeModal.tsx` |
| 12 | Manual testing | - |
