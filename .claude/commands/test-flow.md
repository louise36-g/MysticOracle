# /test-flow

Run tests for specified flows.

## Usage
```
/test-flow [suite]
```

## Suites
- `auth` - Authentication flow
- `reading` - Tarot reading completion
- `credits` - Credit system
- `payment` - Payment processing
- `blog` - Blog CMS
- `admin` - Admin dashboard
- `critical` - All critical paths
- `all` - Full test suite

## Example
```
/test-flow critical
/test-flow reading
```

## Behavior
1. Invoke frontend-tester agent
2. Run specified test suite
3. Generate report with pass/fail status
4. If failures: suggest fixes
5. Report coverage if available

## Commands Executed
```bash
# Type check
npx tsc --noEmit

# Unit tests (when configured)
npm test -- --grep [suite]

# E2E tests (when configured)
npx playwright test [suite]
```

## Output Format
```
TEST RESULTS: [Suite Name]
━━━━━━━━━━━━━━━━━━━━━━━
✅ Passed: X
❌ Failed: Y
⏭️ Skipped: Z

[Details of any failures]
```
