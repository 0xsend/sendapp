# Iterative Development Process Guide

**⚠️ IMPORTANT GUIDELINES ⚠️**

This guide provides essential instructions for implementing an agile and iterative development process with tight feedback loops. Following these guidelines ensures efficient development, continuous improvement, and effective problem-solving across all modes.

## Purpose

As a Roo assistant, you should facilitate an iterative development process that focuses on small, manageable steps with frequent feedback. Your goal is to help the development team maintain clarity, adapt to changing requirements, and achieve desired outcomes through structured cycles of development and reflection.

## Development Context Management

You should always keep the development context in mind when working on tasks:

- **Current State**: Understand the existing codebase, architecture, and functionality
- **Desired State**: Clearly define the target outcome or feature to be implemented
- **Results**: Track and evaluate the outcomes of each development iteration

When the context grows too large or complex:
1. Summarize the current context and progress
2. Suggest starting a new iteration with a focused scope
3. Use the `new_task` tool to create a clean slate while preserving essential context

## The Development Loop

The development process follows a structured loop that maximizes efficiency and learning. Each iteration of the loop should be small and focused, allowing for rapid feedback and adjustment.

### 1. Observe

- Analyze the current state of the code and project
- Read and understand the existing implementation
- Identify patterns, constraints, and potential challenges
- Gather requirements and clarify the desired outcome
- Use tools like `read_file`, `list_files`, and `search_files` to build comprehensive understanding

### 2. Orient

- Plan the approach to move from current state to desired state
- Break down complex tasks into smaller, manageable steps
- Design solutions that align with project architecture and standards
- Create tests that validate the expected behavior
- Consider alternative approaches and their trade-offs
- Use tools like `list_code_definition_names` to understand code structure

### 3. Run

- Implement the planned changes using appropriate tools
- Execute tests to validate functionality
- Run the application to verify behavior in context
- Use tools like `apply_diff`, `write_to_file`, and `execute_command` to make and test changes

### 4. Reflect

- Evaluate the results against the desired outcome
- Identify any gaps or unexpected behaviors
- Consider performance, maintainability, and other quality factors
- Document learnings and insights for future iterations
- Use tools like `browser_action` to verify user-facing functionality

### 5. Repeat

- Incorporate learnings into the next iteration
- Adjust the approach based on reflection
- Continue the loop until the desired state is achieved
- Avoid getting stuck in unproductive cycles

If progress is blocked or there is uncertainty:
- Clearly explain the problem and current understanding
- Use the `ask_followup_question` tool to request clarification
- Suggest specific alternatives to move forward

## When to Apply This Process

This iterative development approach should be applied in these scenarios:

1. When implementing new features or functionality
2. When refactoring existing code
3. When fixing bugs or addressing issues
4. When optimizing performance or improving user experience
5. When exploring technical solutions or prototyping

## Example Development Loop

```
# Implementing a New User Authentication Feature

## Observe
- Current system has no authentication
- Requirements specify email/password login with JWT tokens
- Project uses Express.js backend with React frontend

## Orient
- Plan to add user model with password hashing
- Design login/register endpoints
- Create authentication middleware
- Add protected routes
- Implement frontend login/register forms

## Run
- Implement user model with bcrypt password hashing
- Create login/register API endpoints
- Test endpoints with Postman
- Implement frontend components
- Connect frontend to API

## Reflect
- Login functionality works as expected
- Password reset feature is missing
- Error handling could be improved
- JWT token expiration needs adjustment

## Repeat
- Add password reset functionality
- Enhance error handling
- Adjust token expiration settings
- Test complete authentication flow
```

## Benefits of Iterative Development

* **Reduced Risk**: Small, incremental changes minimize the impact of errors
* **Faster Feedback**: Regular testing and validation catch issues early
* **Increased Adaptability**: Easy to adjust course based on new information
* **Better Quality**: Continuous reflection leads to ongoing improvements
* **Enhanced Learning**: Each iteration builds knowledge and understanding

**⚠️ FINAL REMINDER ⚠️**

The development process should always prioritize clarity, simplicity, and feedback. When tasks become complex, break them down into smaller iterations. When context becomes overwhelming, summarize and create a new focused task. By following this iterative approach, you'll help the development team achieve their goals efficiently and effectively.
