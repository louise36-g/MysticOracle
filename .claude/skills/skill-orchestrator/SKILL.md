---
name: skill-orchestrator
description: Automatically invoke the right skills and agents for MysticOracle tasks. Use before any response to check if a skill or agent should be invoked first. Maps UI work to frontend-design, new code to test-driven-development, React to react-specialist, database to postgres-pro, refactoring to refactoring-specialist, accessibility to accessibility-tester, SEO to seo-specialist, AI prompts to prompt-engineer.
---

# Skill Orchestrator

Automatically invoke the right skills and agents for MysticOracle tasks. Based on [obra/superpowers](https://github.com/obra/superpowers).

## Core Rule

**Invoke relevant skills BEFORE responding.** Even with 1% relevance, invoke the skill. You do not have a choice.

## Workflow

1. Receive user message
2. Check skill/agent mapping below
3. Invoke applicable skill or spawn agent FIRST
4. Announce what you're invoking and why
5. Follow the skill exactly
6. Then respond to user

## Red Flag Rationalizations (NEVER use these)

If you think any of these, STOP and invoke the skill anyway:

- "This is just a simple question"
- "I need more context first"
- "The skill seems like overkill"
- "I already know what this skill says"
- "Let me explore the code first"
- "I'll use it after I understand the problem"
- "This doesn't quite fit"

## MysticOracle Skill Map

### Skills (invoke via Skill tool)

| Trigger | Skill | When |
|---------|-------|------|
| UI work | `frontend-design` | Any component styling, layout, visual changes |
| New code | `test-driven-development` | Writing new functions, components, features |
| Long session | `context-optimization` | 30+ tool calls, complex multi-file work |
| Token pressure | `context-compression` | Large files, extensive exploration |

### Agents (spawn via Task tool)

| Trigger | Agent | When |
|---------|-------|------|
| React components | `react-specialist` | Component architecture, hooks, React 19 features |
| Refactoring | `refactoring-specialist` | Breaking up large files, extracting hooks |
| Database | `postgres-pro` | Schema changes, query optimization, Prisma |
| Accessibility | `accessibility-tester` | WCAG compliance, keyboard nav, screen readers |
| SEO | `seo-specialist` | Meta tags, schema markup, blog optimization |
| AI prompts | `prompt-engineer` | Tarot interpretation prompts, horoscope generation |

## Priority Order

When multiple skills/agents apply:

1. **Process skills first** (TDD, context-optimization)
2. **Domain agents second** (react-specialist, postgres-pro)
3. **Quality agents third** (accessibility-tester, seo-specialist)

## Task-Skill Mapping Examples

| User Request | Invoke |
|--------------|--------|
| "Add a button to..." | `frontend-design` skill, then `react-specialist` agent |
| "Fix this database query" | `postgres-pro` agent |
| "Refactor ActiveReading" | `refactoring-specialist` agent |
| "Make this accessible" | `accessibility-tester` agent |
| "Improve the AI response" | `prompt-engineer` agent |
| "Write a new utility function" | `test-driven-development` skill |
| "Style the card component" | `frontend-design` skill |
| "Add SEO to blog posts" | `seo-specialist` agent |

## Invoking Skills

```
# Skill (runs inline)
Use Skill tool with skill name

# Agent (spawns subprocess)
Use Task tool with subagent_type parameter
```

## Rigid vs Flexible

**Rigid (follow exactly):**
- `test-driven-development` - Must write tests first
- `context-compression` - Must apply all techniques

**Flexible (adapt to context):**
- `frontend-design` - Guidelines, not rules
- `context-optimization` - Apply relevant strategies

## Checklist

Before every response, ask:

- [ ] Does this involve UI? → `frontend-design`
- [ ] Am I writing new code? → `test-driven-development`
- [ ] Is this React-specific? → `react-specialist`
- [ ] Is this database-related? → `postgres-pro`
- [ ] Does this affect accessibility? → `accessibility-tester`
- [ ] Is this SEO-related? → `seo-specialist`
- [ ] Am I modifying AI prompts? → `prompt-engineer`
- [ ] Is there a large file to refactor? → `refactoring-specialist`
- [ ] Is the session getting long? → `context-optimization`

If ANY answer is yes, invoke BEFORE doing anything else.
