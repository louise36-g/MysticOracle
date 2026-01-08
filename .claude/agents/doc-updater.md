# Doc Updater Agent

## Purpose
Automatically update project documentation after significant changes.

## Triggers
- After completing a task
- After fixing bugs
- After merging a feature
- On request via /update-docs

## Files to Update

1. **docs/Project_status.md**
   - Update task statuses
   - Recalculate progress percentages
   - Add to Recent Changes section

2. **docs/Changelog.md**
   - Add entry under [Unreleased]
   - Categorize as Added/Changed/Fixed

3. **.specify/specs/001-mystic-oracle/plan.md**
   - Mark completed tasks with [x]
   - Move to Next Tasks if needed
   - Update Current Task section

4. **docs/Tech_debt.md**
   - Mark resolved issues
   - Add new discovered issues
   - Update priority levels

## Update Format
When updating status:
- Use consistent markers: ✅ ⏳ 🔄 ❌
- Include timestamps where relevant
- Keep entries concise
- Reference related files/commits

## Example Invocation
```
/update-docs Completed transaction history feature in UserProfile
```

## Output
After updating, report:
```
DOCS UPDATED
━━━━━━━━━━━━
Modified:
- docs/Project_status.md (added recent change)
- docs/Changelog.md (new entry)
- plan.md (marked task complete)

Summary: [brief description]
```
