# ScrollDirectionProvider

The `ScrollDirectionProvider` provides scroll direction tracking and scroll position information for React Native and Next.js applications. It detects whether users are scrolling up or down, and also tracks if they've reached the end of scrollable content.

## Overview

This provider creates a React context that exposes:

1. Current scroll direction (up/down/null)
2. Whether the user has scrolled to the end of content
3. Scroll event handlers to attach to scrollable components
4. A ref for ScrollView (when needed)

## Use Cases

- Show/hide UI elements based on scroll direction (e.g., navigation bars)
- Load more content when user scrolls to the end (infinite scrolling)
- Persist scroll position between route changes (web only)
- Track scroll positions for analytics or user experience improvements

## Basic Usage

### Setup

The provider should be included in your app's provider tree:

```tsx
import { ScrollDirectionProvider } from 'app/provider/scroll/'

function App() {
  return (
    <ScrollDirectionProvider>
      {/* Your app components */}
    </ScrollDirectionProvider>
  )
}
```

### Using the hook

Use the `useScrollDirection` hook to access scroll information:

```tsx
import { useScrollDirection } from 'app/provider/scroll/ScrollDirectionContext'

function MyComponent() {
  const { direction, isAtEnd, onScroll, onContentSizeChange, ref } = useScrollDirection()
  
  // Hide navigation when scrolling down
  useEffect(() => {
    if (direction === 'down') {
      // Hide navigation
    } else if (direction === 'up') {
      // Show navigation
    }
  }, [direction])

  // Load more content when reaching the end
  useEffect(() => {
    if (isAtEnd) {
      loadMoreContent()
    }
  }, [isAtEnd])

  return (
    <ScrollView
      ref={ref}
      onScroll={onScroll}
      onContentSizeChange={onContentSizeChange}
      scrollEventThrottle={16} // Recommended for smooth tracking
    >
      {/* Scrollable content */}
    </ScrollView>
  )
}
```

## API Reference

### ScrollDirectionProvider

```tsx
<ScrollDirectionProvider>
  {children}
</ScrollDirectionProvider>
```

Wraps your application to provide scroll direction context.

### useScrollDirection

```tsx
const { 
  direction, 
  isAtEnd, 
  onScroll, 
  onContentSizeChange, 
  ref 
} = useScrollDirection()
```

Returns:

| Property | Type | Description |
|----------|------|-------------|
| `direction` | `'up'` \| `'down'` \| `null` | Current scroll direction or `null` if not scrolling |
| `isAtEnd` | `boolean` | `true` if user has scrolled to the end of content |
| `onScroll` | `ScrollViewProps['onScroll']` | Event handler to attach to ScrollView |
| `onContentSizeChange` | `ScrollViewProps['onContentSizeChange']` | Event handler to attach to ScrollView |
| `ref` | `React.RefObject<ScrollView>` | Ref to attach to ScrollView |

## Platform-Specific Behavior

### Web (Next.js)

On web, the provider also:
- Tracks scroll positions by route
- Restores scroll position when navigating between routes
- Uses Next.js router for route tracking

### Native (React Native)

On native, the provider:
- Tracks current scroll direction
- Detects when user has reached end of content
- Does not persist scroll positions between screens (navigation handled differently)

## Examples

### Hiding Bottom Navigation on Scroll

```tsx
import { useScrollDirection } from 'app/provider/scroll/ScrollDirectionContext'
import { XStack } from 'tamagui'

export const BottomNavBar = () => {
  const { direction } = useScrollDirection()
  
  return (
    <XStack
      bottom={direction === 'down' ? -80 : 0} // Hide when scrolling down
      animation="200ms"
      animateOnly={['bottom']}
      // Other styling props
    >
      {/* Navigation content */}
    </XStack>
  )
}
```

### Infinite Scroll Implementation

```tsx
import { useScrollDirection } from 'app/provider/scroll/ScrollDirectionContext'
import { FlatList } from 'react-native'

export const InfiniteList = ({ fetchNextPage, hasNextPage, isFetchingNextPage, data }) => {
  const { isAtEnd } = useScrollDirection()
  
  useEffect(() => {
    if (isAtEnd && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [isAtEnd, hasNextPage, fetchNextPage, isFetchingNextPage])
  
  return (
    <FlatList
      data={data}
      renderItem={({ item }) => (
        // Render items
      )}
      ListFooterComponent={
        isFetchingNextPage ? <LoadingIndicator /> : null
      }
    />
  )
}
```

## Implementation Notes

- A scroll threshold (default: 50px) determines when to trigger direction changes
- Both component dimensions and scroll offsets are tracked to determine end-of-content
- Performance optimized with refs for frequently changing values
- Context value is memoized to prevent unnecessary re-renders