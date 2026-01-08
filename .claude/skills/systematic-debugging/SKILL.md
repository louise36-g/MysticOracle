---
name: systematic-debugging
description: Debug issues methodically using a structured approach. Use when investigating bugs, errors, unexpected behavior, or when things don't work as expected.
---

# Systematic Debugging

A structured approach to finding and fixing bugs.

## When to Use

Apply this skill when:
- Something doesn't work as expected
- Error messages appear
- Behavior differs from specification
- User reports a bug
- Tests fail unexpectedly

## Debugging Protocol

### Phase 1: Understand the Problem

1. **Reproduce the issue**
   - Can you make it happen consistently?
   - What are the exact steps?
   - What's the expected vs actual behavior?

2. **Gather information**
   - Error messages (exact text)
   - Console output (browser + server)
   - Network requests (status codes, responses)
   - User context (logged in? which page?)

3. **Define the scope**
   - When did it start happening?
   - Does it affect all users or specific cases?
   - Which components/routes are involved?

### Phase 2: Locate the Bug

1. **Form hypotheses**
   - List possible causes (most likely first)
   - Consider recent changes
   - Check similar working functionality

2. **Trace the data flow**
   ```
   User Action → Component → API Call → Server Route → Database
                                    ↓
   Display ← Component ← Response ← Server Logic
   ```

3. **Narrow down location**
   - Frontend or backend?
   - Which file/function?
   - Which line of code?

4. **Use debugging tools**
   ```bash
   # Check TypeScript errors
   npx tsc --noEmit

   # Check server logs
   # (look at terminal running npm run dev in server/)

   # Database queries
   npx prisma studio
   ```

### Phase 3: Fix the Bug

1. **Understand the root cause**
   - Why did this bug occur?
   - Is it a typo, logic error, missing case?

2. **Implement the fix**
   - Make minimal changes
   - Don't refactor unrelated code
   - Keep the fix focused

3. **Verify the fix**
   - Does the original issue still occur?
   - Did the fix break anything else?
   - Test edge cases

### Phase 4: Prevent Recurrence

1. **Add validation if missing**
   - Input validation
   - Type guards
   - Null checks

2. **Consider adding tests**
   - Would a test have caught this?
   - Add test for this case

3. **Update documentation**
   - Note in Tech_debt.md if systemic issue
   - Update comments if behavior was unclear

## Common MysticOracle Bug Patterns

### Credit Issues
- Check: Backend deducts credits (not frontend)
- Check: Transaction created with correct type
- Check: User.credits updated atomically

### API Issues
- Check: Correct endpoint URL
- Check: Auth token included
- Check: Request body matches schema
- Check: Response parsed correctly

### Reading History
- Check: Reading saved with all fields
- Check: Fetching from backend (not localStorage)
- Check: followUpQuestions is JSON array

### Horoscope
- Check: OPENROUTER_API_KEY is set
- Check: Sign is lowercase
- Check: Cache check working

## Output Format

When debugging, report:
```
BUG INVESTIGATION: [brief description]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SYMPTOMS:
- [what's happening]
- [error message if any]

HYPOTHESES:
1. [most likely cause]
2. [second possibility]

INVESTIGATION:
- Checked [x]: [result]
- Checked [y]: [result]

ROOT CAUSE:
[explanation of why bug occurred]

FIX:
File: [path]
Change: [description]

VERIFICATION:
✅ Original issue resolved
✅ No regression introduced
```

## Best Practices

1. **Don't guess** - Investigate methodically
2. **One change at a time** - Easier to track what works
3. **Check the obvious** - Typos, missing imports, wrong URLs
4. **Read error messages** - They often tell you exactly what's wrong
5. **Compare with working code** - What's different?
6. **Take breaks** - Fresh eyes find bugs faster
