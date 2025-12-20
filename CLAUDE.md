# MysticOracle - Project Guide

## Overview

MysticOracle is a mystical tarot reading web application built with React and TypeScript. It provides AI-powered tarot card readings and horoscope interpretations using the OpenRouter API.

## Tech Stack

- **Frontend**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS (inline classes)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **AI Integration**: OpenRouter API (OpenAI SDK)
- **State Management**: React Context API

## Project Structure

```
MysticOracle/
├── App.tsx                 # Main application component
├── index.tsx               # React entry point
├── index.html              # HTML entry point
├── types.ts                # TypeScript type definitions
├── constants.ts            # Tarot cards data, spread configurations
├── components/
│   ├── ActiveReading.tsx   # Main tarot reading flow component
│   ├── AuthModal.tsx       # Login/Register modal
│   ├── Header.tsx          # Navigation header
│   ├── SpreadSelector.tsx  # Spread type selection
│   ├── Card.tsx            # Tarot card display component
│   ├── Button.tsx          # Reusable button component
│   ├── UserProfile.tsx     # User profile page
│   ├── HoroscopeReading.tsx# Horoscope display
│   ├── ReadingModeSelector.tsx # Reading mode selection
│   ├── reading/
│   │   ├── OracleChat.tsx  # Chat interface for follow-up questions
│   │   └── ReadingShufflePhase.tsx # Card shuffle animation
│   ├── ui/
│   │   ├── ErrorBoundary.tsx # Error boundary wrapper
│   │   └── FormInput.tsx   # Reusable form input
│   └── icons/
│       ├── FlagEN.tsx      # English flag SVG
│       └── FlagFR.tsx      # French flag SVG
├── context/
│   └── AppContext.tsx      # Global state (user, language, readings)
├── services/
│   ├── openrouterService.ts # OpenRouter API integration
│   └── storageService.ts   # LocalStorage wrapper
├── utils/
│   ├── crypto.ts           # Secure token generation, password hashing
│   ├── shuffle.ts          # Fisher-Yates shuffle algorithm
│   ├── translations.ts     # i18n helper functions
│   └── validation.ts       # Input validation utilities
└── vite.config.ts          # Vite configuration
```

## Key Concepts

### Language Support
The app supports English (en) and French (fr). Use the `language` state from `useApp()` context.

### Tarot Spreads
Three spread types defined in `SpreadType` enum:
- `SINGLE` - Single card reading
- `THREE_CARD` - Past/Present/Future
- `CELTIC_CROSS` - Full 10-card spread

### Interpretation Styles
Defined in `InterpretationStyle` enum:
- `CLASSIC` - Traditional divination
- `SPIRITUAL` - Soul lessons, karma
- `PSYCHO_EMOTIONAL` - Subconscious patterns
- `METAPHYSICAL` - Energy, chakras
- `ELEMENTAL` - Element balance

### User Credits System
Users have credits that are consumed when requesting readings. Different spreads have different costs.

## Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm build

# Preview production build
npm run preview

# Type check
npx tsc --noEmit
```

## Environment Variables

Create a `.env.local` file with:
```
VITE_API_KEY=your_openrouter_api_key
```

## Code Conventions

- Use `useCallback` for event handlers passed to child components
- Use `useMemo` for expensive computations
- All text should support bilingual display (check `language` from context)
- Use Tailwind CSS classes for styling
- Prefer functional components with hooks

## State Management

The `AppContext` provides:
- `user` - Current logged-in user
- `language` - Current language ('en' | 'fr')
- `setLanguage()` - Change language
- `login()` / `logout()` - Authentication
- `register()` - User registration
- `addReading()` - Save a reading
- `updateCredits()` - Modify user credits

## API Integration

The `openrouterService.ts` handles AI interactions:
- `generateTarotReading()` - Get a tarot interpretation
- `generateFollowUpReading()` - Answer follow-up questions
- `generateHoroscope()` - Get daily horoscope

Features retry logic with exponential backoff and timeout handling.
