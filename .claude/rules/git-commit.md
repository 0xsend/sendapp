# Git Commit Conventions

Follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

## Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## Types

| Type | Use for |
|------|---------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, whitespace |
| `refactor` | Code change (not fix/feature) |
| `perf` | Performance improvement |
| `test` | Adding/correcting tests |
| `chore` | Build process, tooling |

## Claude Signature

Always include at the end of commit messages:

```
Co-Authored-By: Claude <noreply@anthropic.com>
```
