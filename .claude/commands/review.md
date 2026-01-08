# /review

Review code changes for quality and security.

## Usage
```
/review [file path or description]
/review --staged  # Review staged git changes
/review --recent  # Review recent commits
```

## Example
```
/review components/ActiveReading.tsx
/review --staged
/review "the payment integration changes"
```

## Behavior
1. Invoke code-reviewer agent
2. Analyze specified code
3. Check against project standards:
   - Security vulnerabilities
   - TypeScript best practices
   - Project conventions
   - Performance concerns
4. Generate review report

## Review Categories

### Security
- Hardcoded secrets
- Input validation
- Auth checks
- XSS/injection risks

### Quality
- Type safety
- Error handling
- Component size
- Code duplication

### Conventions
- Functional components
- API service usage
- Translation strings
- Loading/error states

## Output Format
```
CODE REVIEW: [scope]
━━━━━━━━━━━━━━━━━━━
Overall: ✅ Approved / ⚠️ Changes Requested / ❌ Rejected

ISSUES:
🔴 Critical: [issue + fix]
🟠 Warning: [issue + suggestion]
🟡 Suggestion: [improvement]

APPROVED:
✅ [good practice noted]
✅ [convention followed]
```
