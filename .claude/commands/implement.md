# /implement

Create implementation plan and execute with focused approach.

## Usage
```
/implement [feature/task description]
```

## Example
```
/implement Add error boundaries to React components
/implement Implement rune reading spread type
/implement Create Tarot Saga teaser page for mobile funnel
```

## Behavior

### Phase 1: Planning
1. Analyze task requirements
2. Read relevant context files:
   - CLAUDE.md (project context)
   - Architecture.md (system design)
   - plan.md (current tasks)
   - Related component files
3. Break into atomic tasks
4. Identify dependencies
5. Output implementation plan

### Phase 2: Execution
For each task:
1. State the task clearly
2. List files to create/modify
3. Define success criteria
4. Implement
5. Verify against criteria

### Phase 3: Validation
1. Run type check: `npx tsc --noEmit`
2. Run linter: `npm run lint`
3. Manual verification checklist
4. Update documentation

## Success Criteria Format
Every implementation must define:
- [ ] Functional requirement met
- [ ] Types compile without errors
- [ ] No linter warnings
- [ ] Matches existing patterns
- [ ] Edge cases handled
- [ ] Error states handled

## Output Format
After each task:
```
TASK COMPLETE: [name]
━━━━━━━━━━━━━━━━━━━
Files Modified:
- path/to/file.tsx (created)
- path/to/other.ts (modified)

Success Criteria:
✅ [criterion 1]
✅ [criterion 2]
✅ [criterion 3]

Next: [next task or "Implementation complete"]
```

## Post-Implementation
1. Run /test-flow if tests exist
2. Run /update-docs to update documentation
3. Commit changes with descriptive message
