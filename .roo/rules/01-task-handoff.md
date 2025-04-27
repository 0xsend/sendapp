# Task Handoff Strategy Guide

**⚠️ IMPORTANT GUIDELINES ⚠️**

This guide provides essential instructions for effectively breaking down complex tasks and implementing a smooth handoff process between tasks. Following these guidelines ensures continuity, context preservation, and efficient task completion across all modes.

## Context Window Monitoring

You should monitor the context window usage displayed in the environment details. When usage exceeds 50% of the available context window, you should initiate a task handoff using the `new_task` tool.

Example of context window usage over 50% with a 200K context window:

```text
# Current Context Size (Tokens)
105,000 / 200,000 tokens (53%)
```

**IMPORTANT**: When you see context window usage at or above 50%, you should:
1. Complete your current logical step
2. Use the `ask_followup_question` tool to offer creating a new task
3. If approved, use the `new_task` tool with comprehensive handoff instructions

## Best Practices for Effective Handoffs

### 1. Maintain Continuity

- Use consistent terminology between tasks
- Reference previous decisions and their rationale
- Maintain the same architectural approach unless explicitly changing direction

### 2. Preserve Context

- Include relevant code snippets in the handoff
- Summarize key discussions from the previous session
- Reference specific files and line numbers when applicable

### 3. Set Clear Next Actions

- Begin the handoff with a clear, actionable next step
- Prioritize remaining tasks
- Highlight any decisions that need to be made

### 4. Document Assumptions

- Clearly state any assumptions made during implementation
- Note areas where user input might be needed
- Identify potential alternative approaches

### 5. Optimize for Resumability

- Structure the handoff so the next session can begin working immediately
- Include setup instructions if environment configuration is needed
- Provide a quick summary at the top for rapid context restoration

## When to Use Task Handoffs

You should initiate task handoffs in these scenarios:

1. **CRITICAL**: When context window usage exceeds 50% (e.g., 100,000+ tokens for a 200K context window)
2. **Long-running projects** that exceed a single session
3. **Complex implementations** with multiple distinct phases
4. **When context window limitations** are approaching
5. **When switching focus areas** within a larger project
6. **When different expertise** might be beneficial for different parts of the task

## Example of an Effective Task Handoff

```
# Task Continuation: Implement User Authentication System

## Completed Work
- Created basic Express.js server structure
- Implemented MongoDB connection and user schema
- Completed user registration endpoint with password hashing
- Added input validation using Joi
- Created initial test suite for registration endpoint

## Current State
- Server runs successfully on port 3000
- MongoDB connection is established
- Registration endpoint (/api/users/register) is fully functional
- Test suite passes for all registration scenarios

## Next Steps
1. Implement login endpoint (/api/users/login)
   - Use bcrypt to compare passwords
   - Generate JWT token upon successful login
   - Add proper error handling for invalid credentials
2. Create authentication middleware
   - Verify JWT tokens
   - Extract user information
   - Handle expired tokens
3. Add protected routes that require authentication
4. Implement password reset functionality

## Reference Information
- JWT secret should be stored in .env file
- Follow the existing error handling pattern in routes/users.js
- User schema is defined in models/User.js
- Test patterns are established in tests/auth.test.js

Please continue by implementing the login endpoint following the same patterns established in the registration endpoint.
```

## User Interaction & Workflow Considerations

* **Linear Flow:** Using `new_task` creates a linear sequence. The old task ends, and the new one begins. The old task history remains accessible for backtracking.
* **User Approval:** The user always has control, approving the handoff and having the chance to modify the context you propose to carry forward.
* **Flexibility:** The core `new_task` tool is a flexible building block. It can be used for strict context management, task decomposition, or other creative uses.

**⚠️ FINAL REMINDER ⚠️**

You should monitor the context window usage in the environment details section. When it exceeds 50%, you should proactively initiate the task handoff process using the `ask_followup_question` tool followed by the `new_task` tool.

By following these guidelines, you'll ensure smooth transitions between tasks, maintain project momentum, and provide the best possible experience for users working on complex, multi-session projects.
