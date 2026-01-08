# /sprint-status

Get current phase status and recommendations.

## Usage
```
/sprint-status
```

## Behavior
1. Read docs/Project_status.md
2. Read .specify/specs/001-mystic-oracle/plan.md
3. Read docs/Tech_debt.md
4. Calculate metrics:
   - Tasks completed vs remaining
   - Tech debt items by priority
   - Blockers identified
5. Generate recommendations

## Output Format
```
PHASE 1: STABILIZATION
━━━━━━━━━━━━━━━━━━━━━━
Progress: XX% (X/Y tasks)
Health: 🟢 On Track / 🟡 At Risk / 🔴 Blocked

COMPLETED:
✅ Double credit deduction fix
✅ Reading history persistence
✅ Follow-up questions saving

IN PROGRESS:
🔄 Horoscope API error handling

PENDING:
⏳ Error boundaries
⏳ Component splitting
⏳ Test coverage

TECH DEBT:
🔴 Critical: X items
🟠 High: Y items
🟡 Medium: Z items

BLOCKERS:
[List any blockers]

RECOMMENDATIONS:
1. Priority focus: [recommendation]
2. Consider deferring: [item]
3. Quick wins available: [items]
```

## Related Files
- `docs/Project_status.md`
- `.specify/specs/001-mystic-oracle/plan.md`
- `docs/Tech_debt.md`
- `docs/Roadmap.md`
