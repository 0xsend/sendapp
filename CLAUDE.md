# Claude Code Guidelines

This document contains guidelines and best practices for using Claude Code with this project.

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

## Useful Commands

### Linting and Testing

This project uses Biome for linting and formatting. Run lint checks with:

```bash
npx @biomejs/biome check
```

## Other Guidelines

Add additional guidelines as needed for this project.