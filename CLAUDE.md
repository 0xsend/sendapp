# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

Send is a next-generation payments app built as a monorepo with cross-platform support (React Native + Next.js). The architecture consists of:

### Tech Stack
- **Monorepo**: Yarn workspaces with Turborepo
- **Cross-platform**: Tamagui for shared styles, Solito for routing
- **Database/Auth**: Supabase (PostgreSQL + Auth)
- **Blockchain**: Foundry, Wagmi, Viem, Base chain
- **Testing**: Jest (packages), pgTAP (Supabase), Playwright (E2E)
- **Linting**: Biome
- **Development**: Tilt for orchestration

### Key Directories
- `/apps/next`: Next.js web app
- `/apps/expo`: React Native mobile app
- `/apps/distributor`: SEND token distribution service
- `/packages/app`: Shared app logic and components
- `/packages/ui`: Tamagui-based UI components
- `/packages/contracts`: Smart contracts (Foundry)
- `/supabase`: Database schema, migrations, and tests

## Common Commands

### Development
```bash
# Start all services with Tilt (recommended)
tilt up

# Start specific services only
tilt up next:web  # Just the Next.js app

# Stop all services
tilt down

# Web development (without Tilt)
yarn web

# Native development
yarn native
```

### Testing
```bash
# Run all tests
yarn test

# Package-specific tests
cd packages/<package-name> && yarn test

# Supabase tests (requires local instance)
yarn supabase test

# E2E tests (requires running Next.js app)
cd packages/playwright && yarn playwright test

# Run a single test file
cd packages/<package-name> && yarn test path/to/test.test.ts
```

### Linting & Formatting
```bash
# Check code with Biome
npx @biomejs/biome check

# Fix issues automatically
npx @biomejs/biome check . --write

# Run linting via Turbo
yarn lint
yarn lint:fix
```

### Database
```bash
# Start local Supabase
cd supabase && yarn supabase start

# Reset database (required after migration changes)
cd supabase && yarn supabase reset

# Generate TypeScript types
cd supabase && yarn generate

# Create a new migration
cd supabase && yarn migration:diff <migration_name>
```

### Smart Contracts
```bash
# Build contracts
yarn contracts build

# Run contract tests
yarn contracts test

# Deploy to local Anvil
yarn contracts forge script <script_name> --fork-url http://localhost:8546 --broadcast
```

## Development Process

The development process should be agile and iterative and focus on very tight feedback loops.

Keep the context in mind. The context is the current state of the code, the desired state, and the results.

Focus on keeping it simple and small. When the context grows, suggest summarizing the context and starting a new iteration.

Create a TODO list when working on complex tasks to track progress and remain on track.

### Development Loop

A loop focuses on observing the current state, orienting the code to the desired state, running the code, and observing the results:

1. **Observe**: Read the code, understand the problem, and understand the desired state.
2. **Orient**: Write the code and tests to achieve the desired state.
3. **Run**: Execute the process and tests.
4. **Reflect**: Did the code achieve the desired state? Did it fail?
5. **Repeat**: Repeat until the desired state is achieved. Avoid getting stuck in a loop. If progress is blocked, explain the problem and ask for clarification.

## Code Style

Use a consistent style throughout the project, including code formatting, naming conventions, and documentation.

Follow the existing convention and style used in the project. Style can be localized to specific files or sections of code.

It is acceptable to vary styles to avoid making too many changes at once.

Assume the style is enforced by a linter and formatter.

### Platform-Specific Code

This project uses a platform-specific extension pattern to handle web vs. native differences:

1. **File naming convention**:
   - Base component: `ComponentName.tsx` - shared logic or web-specific implementation
   - Native override: `ComponentName.native.tsx` - React Native specific implementation

2. **When to create platform-specific files**:
   - When UI components need different native implementations
   - When using platform-specific APIs or components
   - When optimizing for different platform performance characteristics
   - When handling platform-specific UX patterns

3. **Example pattern** (TokenActivityFeed):
   - Web version uses RecyclerList (virtualized web list)
   - Native version uses FlatList (React Native's optimized list)
   - Components maintain the same API while using platform-optimized implementations

When developing new features, consider whether platform-specific implementations are needed and follow this established pattern.

### Comments

Focus comments solely on explaining the code's functionality and design choices, not the history of how the code was changed during our session. Ensure final code does not contain comments related to the debugging steps or conversational edits.

## Git Commit Conventions

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages. When making commits, please use the following format:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

Common types include:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that don't affect the meaning of the code (whitespace, formatting, etc.)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools and libraries

### Examples

```
fix: update help.send.app URLs to support.send.app

Updated outdated help.send.app URLs to the new support.send.app domain with appropriate articles path.
```

```
feat(auth): add new passkey authentication flow

Added a new authentication flow using passkeys instead of traditional passwords.
```

Always include the Claude signature at the end of your commit messages:

```
🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

## Documentation

Documentation is a critical component of software development.
Use a root `/docs` folder to store all documentation files.
Keep it well organized, structured, and easy to navigate.
Assume it could be published using a static site generator.

### Grooming, Refining, and Updating

Read the relevant documentation files and update them as needed.

Update the documentation after tasks.

## Testing

This section outlines the testing architecture and procedures for different parts of the project. Understanding how to run tests is crucial after making code changes.

### General Packages (`/packages/*`)

Most packages located under the `/packages` directory utilize **Jest** for testing.

**How to run tests:**

1. Navigate to the specific package directory:
   ```bash
   cd packages/<package-name>
   ```
2. Run the tests using Yarn:
   ```bash
   yarn test | cat
   ```
   *(Note: Piping to `cat` can help with formatting or handling specific terminal output behaviors.)*

### Supabase (`/supabase`)

The `/supabase` package uses **pgTAP** for database testing.

**How to run tests:**

```bash
yarn supabase test
```

**Important Considerations:**

* If you have made changes to database migrations within `/supabase/migrations`, you **must** reset the test database before running tests to ensure the schema is up-to-date. Reset the database using the following command:
  ```bash
  cd supabase && yarn supabase reset
  ```
* Ensure your local Supabase instance (or the designated test instance) is running.
  ```bash
  cd supabase && yarn supabase start
  ```

### Next.js App (`/apps/next`)

The Next.js application located at `/apps/next` uses **Playwright** for end-to-end testing. The Playwright tests themselves are located within the `/packages/playwright` directory.

**How to run tests:**

1. Navigate to the Playwright package directory:
   ```bash
   cd packages/playwright
   ```
2. Run the Playwright tests using Yarn:
   ```bash
   yarn playwright test
   ```
* Ensure the Next.js application is running (usually via `yarn dev` in the `/apps/next` directory) before executing Playwright tests against it.

### Other Apps (`/apps/*`)

Applications located under `/apps` (excluding `/apps/next`) do not currently have standardized testing frameworks established. If you are working within these applications, consider discussing and implementing an appropriate testing strategy.

## Useful Commands

### Linting and Testing

This project uses Biome for linting and formatting. Run lint checks with:

```bash
npx @biomejs/biome check
```

## Continuous Improvement

You should proactively identify opportunities to improve the development lifecycle. Your goal is to help the development team work more efficiently, maintain high code quality, and continuously evolve their processes.

### When to Suggest Improvements

You should suggest improvements in these scenarios:

1. When you notice **repetitive tasks** that could be automated
2. When you observe **inefficiencies** in the development workflow
3. When you identify **inconsistencies** in coding practices or documentation
4. When you recognize **opportunities for optimization** in the build process, testing strategy, or deployment pipeline
5. When you see **potential enhancements** to the project rules themselves
6. When industry **best practices** have evolved since the current processes were established

### Types of Improvements to Consider

#### 1. Development Workflow Enhancements
- Suggest automation for repetitive tasks
- Recommend tools or extensions that could improve productivity
- Identify opportunities to streamline the development process
- Propose improvements to the project structure or organization

#### 2. Code Quality Improvements
- Suggest additional linting rules or code quality checks
- Recommend refactoring strategies for complex or hard-to-maintain code
- Propose patterns or practices to improve code readability and maintainability
- Identify opportunities to reduce technical debt

#### 3. Testing Strategy Optimization
- Recommend improvements to test coverage or testing approaches
- Suggest tools or frameworks that could enhance the testing process
- Identify areas where additional testing would be beneficial
- Propose strategies to make tests more reliable or efficient

#### 4. Documentation Enhancements
- Suggest improvements to documentation structure or content
- Identify areas where additional documentation would be helpful
- Recommend tools or practices to keep documentation up-to-date
- Propose standards for documentation to ensure consistency

## Task Management

When working on complex projects, it's important to break down tasks effectively.

### Task Breakdown Process

1. **Initial Task Analysis**
   - Begin by thoroughly understanding the full scope of the user's request
   - Identify all major components and dependencies of the task
   - Consider potential challenges, edge cases, and prerequisites

2. **Strategic Task Decomposition**
   - Break the overall task into logical, discrete subtasks
   - Prioritize subtasks based on dependencies (what must be completed first)
   - Aim for subtasks that can be completed within a single session (15-30 minutes of work)
   - Consider natural breaking points where context switching makes sense

3. **Creating a Task Roadmap**
   - Present a clear, numbered list of subtasks to the user
   - Explain dependencies between subtasks
   - Provide time estimates for each subtask when possible
   - Use diagrams to visualize task flow and dependencies when helpful

4. **Getting User Approval**
   - Ask for user feedback on the proposed task breakdown
   - Adjust the plan based on user priorities or additional requirements
   - Confirm which subtask to begin with

### Best Practices for Effective Task Management

1. **Maintain Continuity**
   - Use consistent terminology between tasks
   - Reference previous decisions and their rationale
   - Maintain the same architectural approach unless explicitly changing direction

2. **Preserve Context**
   - Include relevant code snippets when discussing implementation
   - Summarize key discussions from the previous interactions
   - Reference specific files and line numbers when applicable

3. **Set Clear Next Actions**
   - Begin with clear, actionable next steps
   - Prioritize remaining tasks
   - Highlight any decisions that need to be made

4. **Document Assumptions**
   - Clearly state any assumptions made during implementation
   - Note areas where user input might be needed
   - Identify potential alternative approaches

## Memory Management

Remember that your effectiveness depends on the clarity and accuracy of the project information presented to you. For complex, ongoing projects, maintaining clear documentation and context is essential.

When providing information about the current state of the project, always include:

1. **Project Context**
   - The overall goal and purpose of the project
   - Key architectural decisions and patterns
   - Technology stack and dependencies

2. **Implementation Details**
   - Files created or modified in the current session
   - Specific functions, classes, or components implemented
   - Design patterns being followed
   - Testing approach

3. **Progress Tracking**
   - Checklist of completed items
   - Checklist of remaining items
   - Any blockers or challenges encountered

4. **User Preferences**
   - Coding style preferences mentioned by the user
   - Specific approaches requested by the user
   - Priority areas identified by the user

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
ALWAYS proactively create or update documentation files (*.md) or README files.
ALWAYS ask before removing files or code.
ALWAYS remove unnecessary files.
