# RecyclerListView pagination and scroll overview (Web + Native)

This document explains our current RecyclerListView (RLV) usage in the app, focusing on pagination and scroll behavior, and records the observed issue on Web: laggy scrolling and occasional missed renders when reaching the end of the list.

Scope and note on architecture
- We use hooks and functional components throughout (no class-based RLV components).
- This document is descriptive only. It does not propose or implement fixes; it captures the current state and the bug.

Primary files
- Web
  - packages/app/features/home/TokenActivityFeed.tsx
  - packages/app/features/affiliate/screen.tsx
  - packages/ui/src/components/RecyclerList.web.tsx
  - packages/app/provider/scroll/ScrollDirectionProvider.tsx (context used by Web consumers)
- Native
  - packages/app/features/home/TokenActivityFeed.native.tsx
  - packages/app/features/activity/RecentActivityFeed.native.tsx
  - packages/app/features/affiliate/screen.native.tsx
  - packages/ui/src/components/RecyclerList.native.tsx
  - packages/app/provider/scroll/ScrollDirectionProvider.native.tsx

Summary of current behavior
- Web
  - TokenActivityFeed.tsx
    - Uses RecyclerListView from "recyclerlistview/web" with DataProvider and GridLayoutProvider created by helper makers in @my/ui.
    - Fixed item height via layoutProviderMakerWeb({ getHeightOrWidth: () => 102 }).
    - Measures container size on layout and passes layoutSize to RLV; forces re-mount via a dynamic key: key={`recycler-${layoutSize.width}-${layoutSize.height}`}.
    - Pagination is driven by useScrollDirection().isAtEnd (from ScrollDirectionProvider). When isAtEnd is true, it fetches the next page and then clones the DataProvider with all pages.
    - Notably, RLV onEndReached is not wired up. onScroll/onContentSizeChange from ScrollDirectionProvider are not passed to RLV here.
  - Affiliate Friends List (screen.tsx)
    - Same general pattern as above on Web. Also performs a delayed fetchNextPage (setTimeout 50ms) and then cloneWithRows.
- Native
  - TokenActivityFeed.native.tsx
    - Uses RLV with a mixed list (header + activities + loader). Pagination uses RLV’s onEndReached with onEndReachedThreshold=1000 and renderAheadOffset=2000.
  - RecentActivityFeed.native.tsx
    - Uses RLV with date separators and a loader. Wires ScrollDirectionProvider.onScroll and onContentSizeChange to RLV for direction tracking; pagination via RLV onEndReached with thresholds and renderAheadOffset tuning.
  - Affiliate Friends List (screen.native.tsx)
    - Uses RLV with onEndReached; shows a footer spinner while fetching more.

Observed issue (Web)
- Symptom: laggy scrolling and occasional missed renders/blanks near the end of the list.
- Current Web approach relies on an external isAtEnd signal from ScrollDirectionProvider to trigger pagination rather than using RLV’s built-in onEndReached. This signal is not directly tied to RLV’s own scroll window and can become stale or late.
- Additionally, the Web lists force re-mount on container layout changes by including layoutSize in the component key, which can disrupt virtualization and cause visible jank.
- DataProvider is updated by cloning with the full set of pages on each fetch, but no stable IDs are provided to DataProvider; this can increase re-render work and reduce RLV’s ability to optimize recycling.
- renderAheadOffset and related tuning are not set on Web lists (defaults may be too conservative for fast scrolls).

Where this shows up in code (examples)
- packages/app/features/home/TokenActivityFeed.tsx (Web)
  - useEffect(() => { if (isAtEnd && hasNextPage && !isFetchingNextPageActivities) { fetchNextPage().then(...) setDataProvider(prev => prev.cloneWithRows(activities)) }}) — pagination is driven by isAtEnd from context.
  - RLV usage with a dynamic key tied to layoutSize; layoutSize is updated via onLayout handler on the Card container.
  - DataProvider/LayoutProvider sourced from @my/ui helpers (see below).
- packages/ui/src/components/RecyclerList.web.tsx
  - dataProviderMakerWeb: wraps RLV DataProvider; supports optional getStableId but web lists currently don’t pass one.
  - layoutProviderMakerWeb: wraps GridLayoutProvider; our web lists pass fixed row heights.
- Native screens (TokenActivityFeed.native.tsx, RecentActivityFeed.native.tsx, affiliate screen.native.tsx)
  - Use RLV’s onEndReached with thresholds and renderAheadOffset; lists include explicit loader rows at the end.

Why this design can cause lag/blanks on Web
- End-of-list detection outside RLV
  - RLV’s virtualization uses its own window and offsets. If we trigger pagination from a separate scroll context (isAtEnd) that isn’t fully synchronized with RLV’s internal window, we can issue fetches too late (or too early), causing visible blanks or sudden reflows.
- Forced re-mounts on layout changes
  - Using a key tied to layoutSize causes a full re-mount whenever the container size changes. This can disrupt recycled cells and item window state, creating jank or missed renders during fast scroll.
- Missing stable IDs
  - Without stable IDs, RLV has less ability to optimize updates when adding pages. This increases re-render churn and may exacerbate lag.
- Conservative defaults for renderAheadOffset
  - With fast scrolls, low renderAheadOffset can lead to blanks while views catch up. Tuning this (as done in native) can reduce visible blanks at high scroll velocity.

Note on functional components and hooks
- Our usage exclusively employs functional components and hooks (e.g., useMemo, useCallback) around RLV and its DataProvider/LayoutProvider.
- RLV supports this pattern well; the issues above are about pagination and windowing integration, not class vs functional component differences.

References (examples used)
- Web code
  - packages/app/features/home/TokenActivityFeed.tsx
  - packages/app/features/affiliate/screen.tsx
  - packages/ui/src/components/RecyclerList.web.tsx
  - packages/app/provider/scroll/ScrollDirectionProvider.tsx
- Native code
  - packages/app/features/home/TokenActivityFeed.native.tsx
  - packages/app/features/activity/RecentActivityFeed.native.tsx
  - packages/app/features/affiliate/screen.native.tsx
  - packages/ui/src/components/RecyclerList.native.tsx
  - packages/app/provider/scroll/ScrollDirectionProvider.native.tsx
- RLV documentation and guides
  - Props reference: https://github.com/Flipkart/recyclerlistview/blob/21049cc89ad606ec9fe8ea045dc73732ff29eac9/src/core/RecyclerListView.tsx#L540-L634
  - Guides: https://github.com/Flipkart/recyclerlistview/tree/master/docs/guides
  - Performance guide: https://github.com/Flipkart/recyclerlistview/tree/master/docs/guides/performance

Next steps (not implemented here)
- Prefer RLV’s onEndReached on Web lists, aligned with its internal window and thresholds.
- Provide stable IDs to DataProvider (via getStableId) for better recycling and minimal re-renders.
- Tune renderAheadOffset and onEndReachedThreshold for Web to reduce blanks during fast scroll.
- Avoid forced re-mounts on layout changes; let RLV manage reflow or use canChangeSize if necessary for layoutSize changes.
- Optionally, keep ScrollDirectionProvider for UI chrome and analytics, but decouple pagination from its isAtEnd signal on Web lists.

