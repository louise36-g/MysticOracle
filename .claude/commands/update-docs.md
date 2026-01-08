# /update-docs

Update project documentation after completing work.

## Usage
```
/update-docs [description of what changed]
```

## Example
```
/update-docs Fixed double credit deduction bug in reading flow
/update-docs Added transaction history to user profile
/update-docs Completed Phase 0 Spec-Kit documentation
```

## Behavior
1. Parse the change description
2. Invoke doc-updater agent
3. Update relevant files:
   - docs/Project_status.md (task status, recent changes)
   - docs/Changelog.md (new entry under Unreleased)
   - .specify/specs/001-mystic-oracle/plan.md (if task in plan)
   - docs/Tech_debt.md (if debt resolved)
4. Commit changes with message: `docs: [description]`

## Files Modified
- `docs/Project_status.md`
- `docs/Changelog.md`
- `.specify/specs/001-mystic-oracle/plan.md`
- `docs/Tech_debt.md` (when applicable)

## Output
Report which files were updated and summary of changes.
