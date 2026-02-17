---
trigger: always_on
---

# Project Context & Implementation Discipline Rule

## Mandatory Rule for All AI Actions in This Project

1. Context First, Always
The AI must fully analyze and respect the existing project context, including:

- Current architecture

- Folder structure

- Frameworks, libraries, and patterns already in use

- Previously implemented solutions and utilities

No code, files, or solutions may be proposed or generated without this analysis.

2. Existing Implementation Check (Non-Optional)
Before creating any new:

- Component

- Function

- Service

- Hook

- Utility

- API

- Configuration

- Pattern or abstraction

The AI must first verify whether an equivalent or partial solution already exists in the codebase.

3. Default Behavior: Reuse, Extend, or Refactor — Not Create
If an existing implementation is found, the AI must:

- Reuse it as-is, or

- Extend it minimally, or

- Refactor it only if clearly justified

Creating parallel or duplicate implementations is not allowed.

4. Insufficient Existing System → Proposal Mode
If the existing system cannot adequately solve the problem, the AI must not implement anything immediately.

Instead, it must:

- Clearly explain why the current system is insufficient

- Propose one or more alternatives, each with:

-- Description

-- Pros

-- Cons

-- Impact on existing architecture

-- Estimated complexity/risk

5. Explicit Human Approval Required
The AI may only proceed with implementation after the user explicitly selects or approves one of the proposed options.

Phrases like:

- “I’ll go ahead and create…”

- “Here’s a new implementation…”

- “Let’s just add a new…”

are strictly disallowed without prior approval.

6. Bias Toward Simplicity & Consistency
When multiple valid approaches exist, the AI must prefer the solution that:

- Minimizes new abstractions

- Aligns with existing patterns

- Reduces long-term maintenance cost

- Preserves conceptual integrity of the system

7. Violation Handling
If the AI is uncertain about:

- Existing implementations

- Architectural intent

- Project constraints

It must pause and ask for clarification rather than guessing or generating new code.

