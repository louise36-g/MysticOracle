# MysticOracle - Implementation Plan

## Current State: Production-Ready (with issues)

The website is functional but has accumulated tech debt and needs stabilization before new features.

## Phase 1: Stabilization (Current Priority)

### Goals
- Fix known bugs
- Eliminate tech debt
- Add essential tests
- Improve error handling

### Tasks

#### Bug Fixes (Completed)
- [x] Double credit deduction
- [x] 0-card readings saved
- [x] Reading history not persisting
- [x] Follow-up questions not saved
- [x] Browser alerts → styled modals

#### Bug Fixes (Pending)
- [ ] Horoscope generation API errors
- [ ] Removed endpoints still called by frontend
- [ ] Translation consistency

#### Tech Debt
- [ ] Consolidate credit deduction (backend only)
- [ ] Remove localStorage history fallback
- [ ] Split large components (ActiveReading, AdminBlog)
- [ ] Add proper error boundaries
- [ ] Standardize API response format

#### Testing
- [ ] Add API endpoint tests (Jest/Vitest)
- [ ] Add critical path E2E tests (Playwright)
- [ ] Add Prisma model tests

#### Documentation
- [x] CLAUDE.md exists
- [x] ARCHITECTURE.md exists
- [x] Spec-Kit documentation
- [ ] Component documentation

## Phase 2: Mobile Funnel

### Goals
- Create Saga teaser experience
- Drive app downloads
- Enable cross-platform progress

### Tasks
- [ ] Create Saga teaser page
- [ ] Implement Fool's Journey preview (1-3 nodes)
- [ ] Add app store links with deep linking
- [ ] Track funnel conversion

### New Routes
- GET /saga/teaser - Saga preview content
- POST /saga/preview/start - Start teaser
- GET /saga/preview/progress - Check teaser progress

## Phase 3: Shared Backend Integration

### Goals
- Add mobile-specific endpoints
- Extend Prisma schema
- Enable full cross-platform experience

### Tasks
- [ ] Add SagaProgress model to Prisma
- [ ] Add CardMastery model
- [ ] Create /api/game/* routes
- [ ] Add energy system to User model
- [ ] Implement Guardian Protocol

### New Prisma Models
```prisma
model SagaProgress {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id])
  currentChapter  Int      @default(0)
  currentNode     Int      @default(1)
  completedNodes  Json     @default("[]")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model CardMastery {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  cardId    String
  xp        Int      @default(0)
  tier      Int      @default(0)

  @@unique([userId, cardId])
}
```

### Extended User Model
```prisma
model User {
  // ... existing fields

  // Mobile additions
  energy          Int       @default(5)
  maxEnergy       Int       @default(5)
  energyLastRegen DateTime  @default(now())
  signifierCard   String?
  worldview       String    @default("standard")
  sagaStreak      Int       @default(0)
  sagaStreakDate  DateTime?

  // Relations
  sagaProgress    SagaProgress?
  cardMastery     CardMastery[]
}
```

## Phase 4: New Features

### Prioritized Backlog
1. Reading sharing (social proof)
2. Rune readings
3. Birth chart calculator
4. Audio interpretations
5. Custom spread builder

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Daily Active Users | ? | Measure baseline |
| Free → Paid Conversion | ? | 5% |
| Credits Purchased/Day | ? | Measure baseline |
| Mobile Funnel Conversion | N/A | 10% |
| Error Rate | ? | <1% |

---

*Phases are sequential but items within phases can be parallelized.*
