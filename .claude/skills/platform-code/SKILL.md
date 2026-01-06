---
name: platform-code
description: Platform-specific code patterns for web vs native (.native.tsx files). Use when creating React components that need different implementations for web and React Native.
---

# Platform-Specific Code Pattern

Send uses file extension conventions to handle web vs. native differences.

## File Naming

| File | Purpose |
|------|---------|
| `ComponentName.tsx` | Shared logic OR web-specific implementation |
| `ComponentName.native.tsx` | React Native specific implementation |

The bundler automatically resolves the correct file based on platform.

## When to Create Platform Files

Create `.native.tsx` variants when:
- UI needs different native implementation
- Using platform-specific APIs or components
- Optimizing for platform performance characteristics
- Handling platform-specific UX patterns

## Example: TokenActivityFeed

```
TokenActivityFeed.tsx        # Web: uses RecyclerList (virtualized)
TokenActivityFeed.native.tsx # Native: uses FlatList (RN optimized)
```

Both files export the same API - platform bundler picks the right one.

## Guidelines

1. Keep APIs identical between platform variants
2. Share types/interfaces in a separate file when needed
3. Platform-specific hooks: `useX.ts` / `useX.native.ts`
4. Prefer shared code; only split when necessary
