# API Key Architecture Refactoring Plan

**Date:** 2026-01-15
**Status:** Planning
**Priority:** High (Blocking horoscope feature)

---

## 1. Problem Analysis

### Current State

**Architectural Inconsistency:**
```
Tarot Readings:
Frontend (VITE_API_KEY) → OpenRouter API directly
✅ Working (uses correct key)

Horoscopes:
Frontend → Backend → Database (SystemSetting) → OpenRouter API
❌ Failing (database has outdated key: sk-or-v1-de50a8...)
```

### Code Smells

| Smell | Location | Severity | Impact |
|-------|----------|----------|--------|
| **Duplicate Configuration** | 3 sources of truth for API key | High | Sync issues, stale data |
| **Inconsistent Architecture** | Tarot=frontend, Horoscope=backend | High | Confusion, bugs |
| **Security Anti-pattern** | API key exposed in frontend code | Critical | Key compromise risk |
| **SRP Violation** | Multiple services managing keys | Medium | Maintenance burden |
| **Database as Config Store** | SystemSetting used for env vars | Medium | Deployment complexity |

### SOLID Violations

1. **Single Responsibility**: `aiSettings.ts` and `openrouterService.ts` both manage API keys
2. **Open/Closed**: Adding new AI features requires modifying both services
3. **Dependency Inversion**: Frontend depends on concrete OpenRouter implementation

---

## 2. Root Cause Analysis

### Why Database Has Outdated Key

Investigation shows:
```javascript
// aiSettings.ts line 35-36
const rawApiKey = settingsMap.get('OPENROUTER_API_KEY') ||
                  process.env.OPENROUTER_API_KEY || null;
```

**Database priority**: Falls back to env var only if database entry is missing.

**When was database populated?**
- Likely during initial setup or admin panel configuration
- No automatic sync mechanism exists
- Environment variable updated but database wasn't

### Why Tarot Works But Horoscope Fails

**Tarot readings:**
```typescript
// openrouterService.ts line 149-152
const apiKey = import.meta.env.VITE_API_KEY;
if (!apiKey) {
  throw new Error("VITE_API_KEY is not configured.");
}
```
→ Uses frontend env var (correct key)

**Horoscopes:**
```typescript
// horoscopes.ts line 65-72
const aiSettings = await getAISettings();
if (!aiSettings.apiKey) {
  throw new Error('AI service not configured.');
}
```
→ Uses database (outdated key)

---

## 3. Refactoring Strategy

### Decision Framework

**Priority Score = (Business Value × Technical Debt) / (Effort × Risk)**

| Option | Business Value | Tech Debt | Effort | Risk | Score |
|--------|---------------|-----------|--------|------|-------|
| Option 1: Backend-only | 10 | 9 | 6 | 3 | 5.0 |
| Option 2: Frontend-only | 6 | 4 | 3 | 8 | 1.0 |
| Option 3: Hybrid | 7 | 6 | 4 | 5 | 2.1 |

**Selected: Option 1 - Backend-Only Architecture**

### Target Architecture

```
┌─────────────────────────────────────────────────────┐
│                     Frontend                         │
│  ┌──────────────────────────────────────────────┐  │
│  │  Tarot & Horoscope Components                │  │
│  │  └─> apiService.ts                            │  │
│  │       • No direct OpenRouter calls            │  │
│  │       • All AI via backend endpoints          │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                        ↕ HTTP
┌─────────────────────────────────────────────────────┐
│                Backend (Express)                     │
│  ┌──────────────────────────────────────────────┐  │
│  │  Unified AI Service                           │  │
│  │  ├─> /api/v1/ai/tarot/generate                │  │
│  │  ├─> /api/v1/ai/tarot/followup                │  │
│  │  ├─> /api/v1/horoscopes/:sign                 │  │
│  │  └─> /api/v1/horoscopes/:sign/followup        │  │
│  │                                               │  │
│  │  ✅ Single source: process.env.OPENROUTER_API_KEY │
│  │  ✅ No database lookups                         │  │
│  │  ✅ Cached in memory (5min TTL)                 │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                        ↕
┌─────────────────────────────────────────────────────┐
│               OpenRouter API                         │
│  • Single authenticated source                       │
│  • Better rate limiting control                      │
│  • Audit logging possible                            │
└─────────────────────────────────────────────────────┘
```

---

## 4. Implementation Plan

### Phase 1: Immediate Fix (30 minutes)

**Goal:** Unblock horoscope feature

**Changes:**
1. Update `aiSettings.ts` to prioritize env var over database:
   ```typescript
   // BEFORE
   const rawApiKey = settingsMap.get('OPENROUTER_API_KEY') ||
                     process.env.OPENROUTER_API_KEY || null;

   // AFTER
   const rawApiKey = process.env.OPENROUTER_API_KEY ||
                     settingsMap.get('OPENROUTER_API_KEY') || null;
   ```

2. Add logging to debug key source:
   ```typescript
   const source = process.env.OPENROUTER_API_KEY ? 'env' : 'database';
   console.log(`[AI Settings] Using API key from: ${source}`);
   ```

3. Restart backend server to pick up change

**Testing:**
- ✓ Horoscope generation works
- ✓ Tarot readings still work
- ✓ Admin panel shows key status

**Rollback Plan:** Revert aiSettings.ts change

---

### Phase 2: Create Unified Backend AI Endpoint (4 hours)

**File:** `server/src/services/openRouterService.ts` (new)

**Purpose:** Single service for all OpenRouter API calls

**Interface:**
```typescript
interface OpenRouterServiceConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

class OpenRouterService {
  private client: OpenAI;
  private config: OpenRouterServiceConfig;

  constructor(config: OpenRouterServiceConfig);

  async generateTarotReading(params: TarotReadingParams): Promise<string>;
  async generateTarotFollowUp(params: FollowUpParams): Promise<string>;
  async generateHoroscope(params: HoroscopeParams): Promise<string>;
  async generateHoroscopeFollowUp(params: FollowUpParams): Promise<string>;
}
```

**Benefits:**
- ✅ Single client instance
- ✅ Shared retry logic
- ✅ Consistent error handling
- ✅ Easy to add caching
- ✅ Easy to add rate limiting

**Files to Create:**
- `server/src/services/openRouterService.ts`
- `server/src/services/openRouterService.test.ts`

**Files to Modify:**
- `server/src/routes/horoscopes.ts` - Use new service
- `server/src/routes/ai.ts` - Create new endpoint for tarot

---

### Phase 3: Refactor Tarot to Backend (6 hours)

**Create Backend Endpoint:**
```typescript
// POST /api/v1/ai/tarot/generate
router.post('/tarot/generate', requireAuth, async (req, res) => {
  const { spread, style, cards, question, language } = req.body;

  // Deduct credits (moved from frontend)
  await deductCredits(req.userId, spread.creditCost);

  const interpretation = await openRouterService.generateTarotReading({
    spread, style, cards, question, language
  });

  res.json({ interpretation });
});
```

**Update Frontend:**
```typescript
// services/apiService.ts
export async function generateTarotReading(
  token: string,
  params: TarotReadingParams
): Promise<{ interpretation: string }> {
  return apiRequest('/api/v1/ai/tarot/generate', {
    method: 'POST',
    body: params,
    token
  });
}
```

**Migration Steps:**
1. Create backend endpoint
2. Update ActiveReading.tsx to call new endpoint
3. Remove openrouterService.ts imports from frontend
4. Remove VITE_API_KEY from frontend .env
5. Test all tarot spreads
6. Deploy with feature flag (gradual rollout)

**Risks & Mitigation:**
- **Risk:** Increased backend load
  - *Mitigation:* Add Redis caching for duplicate readings
- **Risk:** Network latency
  - *Mitigation:* Implement streaming responses
- **Risk:** Backend downtime blocks readings
  - *Mitigation:* Implement circuit breaker pattern

---

### Phase 4: Remove Database API Key (2 hours)

**Goal:** Single source of truth for configuration

**Changes:**
1. Update `aiSettings.ts` to use env vars only:
   ```typescript
   export async function getAISettings(): Promise<AISettings> {
     // No database query - just env vars
     return {
       apiKey: process.env.OPENROUTER_API_KEY?.trim() || null,
       model: process.env.AI_MODEL || 'openai/gpt-oss-120b:free',
     };
   }
   ```

2. Migration script to backup and remove database entries:
   ```sql
   -- Backup
   INSERT INTO system_setting_archive SELECT * FROM system_setting
   WHERE key = 'OPENROUTER_API_KEY';

   -- Remove
   DELETE FROM system_setting WHERE key = 'OPENROUTER_API_KEY';
   ```

3. Update Prisma schema (optional - remove if no longer used):
   ```prisma
   // Comment out or remove if SystemSetting is no longer needed
   // model SystemSetting { ... }
   ```

**Documentation Updates:**
- Update CLAUDE.md with environment variable requirements
- Update deployment guide
- Update admin panel docs

---

### Phase 5: Update Admin Settings UI (3 hours)

**Goal:** Show env var status, not editable database fields

**AdminSettings.tsx Changes:**
```typescript
// BEFORE: Editable field to update database
<input
  type="password"
  value={apiKey}
  onChange={e => setApiKey(e.target.value)}
/>
<button onClick={saveApiKey}>Save</button>

// AFTER: Read-only display of env var status
<div className="env-var-status">
  <CheckCircle /> API Key configured via environment variable
  <code>OPENROUTER_API_KEY</code>
  <p className="text-xs text-gray-500">
    To update, change environment variable and restart server
  </p>
</div>
```

**Display:**
- ✅ Key present: Green check, first 10 chars shown
- ❌ Key missing: Red X, setup instructions
- Link to deployment/setup documentation

---

## 5. Testing Strategy

### Unit Tests

```typescript
// aiSettings.test.ts
describe('getAISettings', () => {
  it('should return API key from env var', async () => {
    process.env.OPENROUTER_API_KEY = 'test-key';
    const settings = await getAISettings();
    expect(settings.apiKey).toBe('test-key');
  });

  it('should return null when no key configured', async () => {
    delete process.env.OPENROUTER_API_KEY;
    const settings = await getAISettings();
    expect(settings.apiKey).toBeNull();
  });
});

// openRouterService.test.ts
describe('OpenRouterService', () => {
  it('should generate tarot reading', async () => {
    const service = new OpenRouterService(config);
    const reading = await service.generateTarotReading(params);
    expect(reading).toBeTruthy();
  });

  it('should handle rate limiting', async () => {
    // Mock 429 response
    const service = new OpenRouterService(config);
    await expect(service.generateTarotReading(params))
      .rejects.toThrow('Rate limited');
  });
});
```

### Integration Tests

```typescript
// horoscope.e2e.test.ts
describe('Horoscope API', () => {
  it('should generate horoscope', async () => {
    const response = await request(app)
      .get('/api/v1/horoscopes/Aries?language=en')
      .expect(200);

    expect(response.body.horoscope).toBeTruthy();
  });

  it('should fail with invalid sign', async () => {
    await request(app)
      .get('/api/v1/horoscopes/InvalidSign')
      .expect(400);
  });
});

// tarot.e2e.test.ts
describe('Tarot API', () => {
  it('should generate reading with auth', async () => {
    const response = await request(app)
      .post('/api/v1/ai/tarot/generate')
      .set('Authorization', `Bearer ${testToken}`)
      .send(tarotParams)
      .expect(200);

    expect(response.body.interpretation).toBeTruthy();
  });

  it('should reject without auth', async () => {
    await request(app)
      .post('/api/v1/ai/tarot/generate')
      .send(tarotParams)
      .expect(401);
  });
});
```

### Manual Testing Checklist

- [ ] Horoscope generation (all 12 signs, EN/FR)
- [ ] Horoscope follow-up questions
- [ ] Tarot reading (all spread types)
- [ ] Tarot follow-up questions
- [ ] Credit deduction works
- [ ] Rate limiting triggers correctly
- [ ] Error messages are user-friendly
- [ ] Admin panel shows correct API key status
- [ ] Works in development environment
- [ ] Works in staging environment
- [ ] Works in production environment

---

## 6. Rollback Strategy

### Phase 1 Rollback
```bash
git revert <commit-hash>
npm run build && pm2 restart all
```

### Phase 2-3 Rollback
1. Re-enable frontend VITE_API_KEY
2. Restore old openrouterService.ts
3. Feature flag to switch back to old flow
4. Database migration to restore SystemSetting entries

### Phase 4-5 Rollback
Restore database entries from archive table.

---

## 7. Metrics & Success Criteria

### Before Refactoring

| Metric | Value |
|--------|-------|
| Horoscope success rate | 0% (401 errors) |
| Tarot success rate | ~95% |
| API key exposure | Frontend exposed |
| Configuration complexity | 3 sources of truth |
| Test coverage | <40% |

### After Refactoring

| Metric | Target |
|--------|--------|
| Horoscope success rate | >95% |
| Tarot success rate | >95% |
| API key exposure | None (backend only) |
| Configuration complexity | 1 source (env vars) |
| Test coverage | >80% |
| Response time | <2s (p95) |

### Monitoring

```typescript
// Add instrumentation
logger.info('AI request', {
  feature: 'tarot' | 'horoscope',
  userId,
  duration: Date.now() - start,
  cacheHit: boolean,
  error: error?.message
});
```

**Alerts:**
- AI request failure rate >5%
- AI request latency >5s (p95)
- API key missing/invalid
- Rate limit exceeded

---

## 8. Timeline & Resources

### Estimated Timeline

| Phase | Duration | Developer Days |
|-------|----------|----------------|
| Phase 1: Immediate Fix | 0.5 hours | 0.1 |
| Phase 2: Unified Service | 4 hours | 0.5 |
| Phase 3: Tarot Refactor | 6 hours | 0.75 |
| Phase 4: Remove DB Key | 2 hours | 0.25 |
| Phase 5: Admin UI | 3 hours | 0.4 |
| Testing & QA | 4 hours | 0.5 |
| **Total** | **19.5 hours** | **2.5 days** |

### Resource Requirements

- 1 Senior Backend Developer (API refactoring)
- 1 Frontend Developer (component updates)
- 1 QA Engineer (testing)
- 1 DevOps Engineer (deployment)

### Dependencies

- Backend tests passing
- Staging environment available
- Access to production environment variables
- Approval from tech lead

---

## 9. Related Documents

- `CLAUDE.md` - Project overview
- `server/SCHEMA_SETUP.md` - Database schema
- `docs/Tech_debt.md` - Technical debt tracking
- `.env.example` - Environment variable template

---

## 10. Approval & Sign-off

**Reviewed by:**
- [ ] Tech Lead
- [ ] Backend Lead
- [ ] Frontend Lead
- [ ] DevOps Lead

**Approved for implementation:** _________________

**Start date:** _________________

**Target completion:** _________________
