# Context Compression Skill

Techniques for reducing token usage in Claude Code sessions while maintaining effectiveness.

## Core Principles

1. **Minimize input** - Request only what you need
2. **Compress output** - Keep responses concise
3. **Avoid redundancy** - Don't repeat information
4. **Batch operations** - Combine related actions

## Compression Techniques

### 1. File Reading

**Use offsets for large files:**
```typescript
// Instead of reading 900 lines, read the section you need
Read({ file_path: "...", offset: 150, limit: 50 })
```

**Read multiple small files in parallel:**
```typescript
// One message, multiple reads
[Read(file1), Read(file2), Read(file3)]
```

### 2. Search Operations

**Filter aggressively:**
```typescript
Grep({
  pattern: "useEffect",
  glob: "*.tsx",           // Only React files
  head_limit: 5,           // Just first 5 matches
  output_mode: "files_with_matches"  // Don't need content
})
```

**Use type filters:**
```typescript
Grep({
  pattern: "export",
  type: "ts",  // More efficient than glob
})
```

### 3. Code Edits

**Batch related edits:**
```typescript
// Good: One edit with replace_all
Edit({ old_string: "oldName", new_string: "newName", replace_all: true })

// Bad: Multiple individual edits for same change
```

**Make minimal edits:**
- Include only enough context for uniqueness
- Don't include unchanged surrounding code
- Use `replace_all` for repetitive changes

### 4. Response Compression

**Keep explanations brief:**
- State what was done, not every detail
- Skip obvious explanations
- Use bullet points over paragraphs

**Example:**
```
BAD: "I have now successfully completed the task of reading the file
     located at /path/to/file.tsx which contains the component that
     handles the card selection logic..."

GOOD: "Read ActiveReading.tsx. The card selection is at lines 150-200."
```

### 5. Tool Output Management

**Limit grep results:**
```typescript
head_limit: 10  // Usually enough to understand the pattern
```

**Use count mode for statistics:**
```typescript
output_mode: "count"  // Just "42 matches" vs 42 code blocks
```

### 6. Agent Delegation

Offload exploration to sub-agents:
- Sub-agent context is separate
- Only results return to main conversation
- Keeps primary context clean

```typescript
Task({
  subagent_type: "Explore",
  prompt: "Find all React hooks usage patterns",
  model: "haiku"  // Faster, cheaper for exploration
})
```

## Anti-Patterns to Avoid

| Anti-Pattern | Better Approach |
|--------------|-----------------|
| Reading then re-reading same file | Read once, reference by line numbers |
| Sequential tool calls that could parallel | Batch in single message |
| Full file reads for small edits | Use offset/limit |
| Verbose status updates | Concise summaries |
| Explaining unchanged code | Focus on what changed |

## Token Budget Awareness

Estimated token costs:
- Average code file read: 2,000-5,000 tokens
- Grep with content: 500-2,000 tokens per result
- Edit operation: 200-500 tokens
- Agent delegation: Fixed overhead + task cost

## Compression Checklist

Before each tool call, ask:
- [ ] Do I need this entire file or just a section?
- [ ] Can I combine this with other pending reads?
- [ ] Is there a more specific search pattern?
- [ ] Should this be delegated to a sub-agent?
- [ ] Am I requesting redundant information?

## Recovery Patterns

When context is getting full:
1. Complete current task before expanding scope
2. Use TodoWrite to checkpoint progress
3. Delegate remaining exploration
4. Summarize findings concisely
5. Make direct edits without re-reading unchanged context
