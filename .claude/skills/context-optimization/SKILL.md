# Context Optimization Skill

Strategies for managing context effectively in long Claude Code conversations to maximize productivity and minimize token usage.

## When to Apply

- Conversations exceeding 50+ tool calls
- Complex multi-file refactoring sessions
- Extended debugging sessions
- Large codebase exploration

## Optimization Strategies

### 1. Targeted File Reading

Instead of reading entire files:
```
BAD:  Read the entire 900-line ActiveReading.tsx
GOOD: Read lines 100-200 of ActiveReading.tsx (the card selection logic)
```

Use `offset` and `limit` parameters when you know which section you need.

### 2. Focused Grep Searches

Use specific patterns with limited results:
```
BAD:  Grep for "function" across entire codebase
GOOD: Grep for "handleCardSelect" in components/*.tsx with head_limit=10
```

### 3. Parallel Tool Calls

When multiple independent operations are needed, batch them:
```
GOOD: Single message with 3 parallel Read calls
BAD:  3 separate messages each with 1 Read call
```

### 4. Incremental Context Building

Build understanding progressively:
1. Start with Glob to identify relevant files
2. Read key files first (entry points, types)
3. Expand to related files only as needed
4. Use Grep for specific patterns vs full file reads

### 5. Output Mode Selection

For Grep, choose the right output mode:
- `files_with_matches`: Just need file paths
- `count`: Need match statistics
- `content`: Need actual code (most expensive)

### 6. Agent Delegation

Delegate exploration to sub-agents:
```
Use Task tool with subagent_type=Explore for:
- "Find all error handling patterns"
- "Understand authentication flow"
- "Map component dependencies"
```

This keeps main conversation context clean.

### 7. Todo List Checkpointing

Use TodoWrite to maintain state:
- Track completed vs pending work
- If context compacts, todos survive
- Helps resume after interruptions

## Context-Aware Patterns

### For Code Review
1. Read types.ts first (understand data shapes)
2. Read the specific file under review
3. Only expand to imports if needed

### For Bug Fixes
1. Grep for error message/symptom
2. Read only the relevant function
3. Check types if needed
4. Make targeted edit

### For New Features
1. Find similar existing features (Explore agent)
2. Read the most relevant example
3. Use that pattern for implementation

## Red Flags (Context Waste)

- Reading files you won't modify
- Re-reading the same file multiple times
- Grep without file type filters
- Full file reads when you need 10 lines
- Not using parallel tool calls

## Monitoring

Watch for signs of context pressure:
- Tool outputs getting truncated
- Summaries being generated
- Repeated file re-reads needed

When you see these, prioritize completing current work over expanding scope.
