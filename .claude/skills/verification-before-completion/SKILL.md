---
name: verification-before-completion
description: Verify work is complete before marking tasks done. Use before saying "done", committing code, or completing any implementation task to ensure quality and completeness.
---

# Verification Before Completion

Ensure all work meets quality standards before marking complete.

## When to Use

Apply this skill:
- Before saying "done" or "complete"
- Before committing code changes
- Before marking tasks complete in todo list
- Before closing issues or PRs

## Verification Checklist

### 1. Functional Requirements
- [ ] All requested features implemented
- [ ] Edge cases handled
- [ ] Error states have user feedback
- [ ] Loading states present where needed

### 2. Code Quality
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] No linter warnings (`npm run lint`)
- [ ] No `console.log` statements left behind
- [ ] No commented-out code
- [ ] No `any` types without justification

### 3. Project Conventions
- [ ] Functional components only (no class components)
- [ ] API calls go through `apiService.ts`
- [ ] Credits deducted on backend only
- [ ] User-facing strings use translation system
- [ ] Proper loading/error states

### 4. Security
- [ ] No hardcoded secrets or API keys
- [ ] User input validated
- [ ] Auth checks on protected routes
- [ ] No XSS vulnerabilities (HTML sanitized)

### 5. Testing
- [ ] Manually tested happy path
- [ ] Manually tested error cases
- [ ] Tested in both EN and FR (if UI change)

### 6. Documentation
- [ ] Code is self-documenting or has comments for complex logic
- [ ] Update docs/Tech_debt.md if new debt introduced
- [ ] Update docs/Changelog.md for significant changes

## Verification Commands

```bash
# Type check
npx tsc --noEmit

# Lint (if configured)
npm run lint

# Build test
npm run build
```

## Output Format

Before marking complete, state:
```
VERIFICATION COMPLETE
━━━━━━━━━━━━━━━━━━━
✅ Functional requirements met
✅ No TypeScript errors
✅ No linter warnings
✅ Conventions followed
✅ Security checks passed
✅ Manually tested

Ready to: [commit/mark complete/close issue]
```

Or if issues found:
```
VERIFICATION FAILED
━━━━━━━━━━━━━━━━━━
❌ TypeScript errors: 2
⚠️ Missing error state in component X

Fixing before completion...
```

## Best Practices

1. **Don't rush** - Take time to verify
2. **Be honest** - If something isn't done, say so
3. **Test visually** - Don't just check code compiles
4. **Check both languages** - EN and FR for UI
5. **Consider mobile** - Test responsive design
