# Code Style Guidelines

**⚠️ IMPORTANT GUIDELINES ⚠️**

This guide provides essential instructions for maintaining consistent code style throughout the project. Following these guidelines ensures readability, maintainability, and collaboration efficiency across all modes.

## Purpose

As a Roo assistant, you should help maintain a consistent code style that aligns with the project's established conventions. Your goal is to ensure that all code contributions follow the project's style guidelines, making the codebase more readable and maintainable for the entire development team.

## Core Style Principles

### 1. Consistency with Existing Code

- Follow the existing style conventions used in the project
- Adapt to file-specific or module-specific style variations when present
- Respect the established patterns for naming, formatting, and organization
- When in doubt, match the style of the surrounding code

### 2. Linter and Formatter Compliance

- Assume the project uses automated linting and formatting tools
- Respect configuration files like `.eslintrc`, `.prettierrc`, or `biome.json`
- Ensure code changes will pass linting checks
- Avoid making style changes that conflict with automated tools

### 3. Gradual Style Adoption

- It is acceptable to maintain different styles in different parts of the codebase
- Avoid making large-scale style changes that aren't directly related to the task
- Focus on functionality first, with style compliance as a secondary concern
- Consider suggesting style improvements as separate, focused tasks

### 4. Effective Comments

- Write comments that explain **why** code exists, not just what it does
- Focus on documenting complex logic, business rules, and design decisions
- Avoid comments that merely restate what is obvious from the code
- Never include comments about debugging steps or conversational edits
- Ensure final code is free of temporary comments or development notes

## When to Apply These Guidelines

These style guidelines should be applied in these scenarios:

1. When writing new code
2. When modifying existing code
3. When reviewing code for quality and consistency
4. When refactoring or restructuring code
5. When suggesting improvements to existing code

## Benefits of Consistent Style

* **Improved Readability**: Consistent style makes code easier to understand
* **Reduced Cognitive Load**: Developers can focus on logic rather than style variations
* **Easier Maintenance**: Consistent patterns are easier to update and refactor
* **Better Collaboration**: Team members can work more effectively together
* **Fewer Bugs**: Clear, consistent code is less likely to contain subtle errors

## Language-Specific Guidelines

When working with specific languages, follow their community-standard conventions:

- **JavaScript/TypeScript**: Follow the style indicated by ESLint/Prettier configuration
- **Python**: Follow PEP 8 guidelines
- **Go**: Follow the official Go style guide
- **Rust**: Follow the Rust style guide
- **Other Languages**: Defer to the project's established conventions

**⚠️ FINAL REMINDER ⚠️**

Code style is an important aspect of software development that affects readability and maintainability. Always prioritize consistency with the existing codebase over personal style preferences. Remember that the primary goal is to create code that is clear, maintainable, and follows the project's established patterns.
