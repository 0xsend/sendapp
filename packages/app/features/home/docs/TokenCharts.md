# Token Price Charts — Implementation (React Native + Web)

Scope and entry points
- Feature components:
  - packages/app/features/home/TokenChartSection.tsx (native)
  - packages/app/features/home/TokenChartSection.web.tsx (web)
- Shared components and hooks:
  - packages/app/features/home/charts/shared/components/ChartCardSection.tsx
  - packages/app/features/home/charts/shared/components/ChartLineSection.tsx
  - packages/app/features/home/charts/shared/components/ChartExtremeLabels.tsx
  - packages/app/features/home/charts/shared/useTokenChartData.ts
  - packages/app/features/home/charts/shared/timeframes.ts (TIMEFRAMES, getDaysForTimeframe, getInterpolationRange, getCgParams)
  - packages/app/features/home/charts/shared/useScrubState.native.ts
  - packages/app/features/home/charts/shared/useScrubState.web.ts
- Rendering primitives (from @my/ui):
  - ChartPathProvider, ChartPath, ChartDot, monotoneCubicInterpolation
- Reference: ../../Rainbow/rainbow-charts-migration/RAINBOW_CHARTS_MIGRATION.md

Current behavior
- Title: Price Overview
- Fixed chart height: 200 (set by ChartLineSection)
- Timeframe tabs: 1D, 1W, 1M, 3M, 6M, 1Y, ALL (layout uses space-around)
- Data fetching: CoinGecko market_chart with unified precision '6' across all timeframes; interval null
- Points: toChartPointsFromPrices maps CG [timestamp, price] → { x, y }
- Smoothing: monotoneCubicInterpolation with includeExtremes and range from getInterpolationRange(tf)
- Scrubbing:
  - Native: useScrubState.native uses Reanimated (useAnimatedReaction) to read originalX/originalY and active
  - Web: useScrubState.web exposes onScrub handler; ChartPath receives onScrub via pathProps
  - ChartScrubReadout shows price and timestamp; change badge is hidden while actively scrubbing
- Extreme labels overlay:
  - Implemented in shared ChartExtremeLabels.tsx for both platforms
  - Positions min/max labels using measured label sizes (onLayout) instead of magic constants
  - Prefers max label above and min label below the points; flips when necessary; clamps within chart bounds; hides while scrubbing
- Loading and layout stability:
  - ChartCardSection always renders children and overlays a centered Spinner while isLoading
  - Timeframe tabs remain visible during loading; chart area stays at fixed height to avoid layout jumps
  - Web-specific TokenChartSection additionally guards childrenBeforePath to show a "No chart data" message when appropriate
- Styling:
  - Line stroke: #40FB50; dot rendered via ChartDot
  - Label bubble background: $color2; text uses $color12
- Width measurement:
  - Measures container width via onLayout; falls back to window width when unset

Recent changes and fixes
- Unified precision across all timeframes (getCgParams returns { interval: null, precision: '6' })
- Renamed heading from Price Chart to Price Overview
- Adjusted timeframe tabs to space-around
- Implemented ExtremeLabels overlay with measured size positioning (replaces any magic offsets)
- Ensured fixed chart height (200) and persistent tabs during loading (spinner overlay)
- Removed duplicate component declarations and resolved lint issues
- Replaced any cast in useTokenChartData; formatted imports for Biome

Known differences vs Rainbow
- Path is a simple polyline; no d3-path/morph animation yet
- Haptics remain disabled (optional to add later)

Next steps (optional)
- Path morph or crossfade between ranges (pick an existing approach)
- Tests for chart behaviors (scrub, extremes, loading)
- Consider aligning any remaining color tokens for platform parity

File map (quick reference)
- Feature:
  - packages/app/features/home/TokenChartSection.tsx
  - packages/app/features/home/TokenChartSection.web.tsx
- Shared:
  - packages/app/features/home/charts/shared/components/ChartCardSection.tsx
  - packages/app/features/home/charts/shared/components/ChartLineSection.tsx
  - packages/app/features/home/charts/shared/components/ChartExtremeLabels.tsx
  - packages/app/features/home/charts/shared/useTokenChartData.ts
  - packages/app/features/home/charts/shared/timeframes.ts
- packages/app/features/home/charts/shared/useScrubState.native.ts
- packages/app/features/home/charts/shared/useScrubState.web.ts

---

Web implementation details (ChartPath.web)
- File: packages/ui/src/components/AnimatedCharts/charts/linear/ChartPath.web.tsx
- Purpose: Web fallback that implements scrubbing without Reanimated. It reads and writes chart state via useChartData and calls onScrub for consumers that need values on the JS thread.
- Events and coordinates:
  - Uses pointer events on the container View: onPointerDown/Move/Up/Cancel/Leave.
  - Extracts coordinates in a platform-agnostic order inside the move handler:
    1) evt.clientX / evt.clientY
    2) evt.nativeEvent.pageX / evt.nativeEvent.pageY
    3) evt.nativeEvent.touches[0] or evt.touches[0] (for touch-derived events)
  - Applies CSS touch-action: 'pan-y' on the container so vertical page scroll is still possible.
  - Calls preventDefault() only once scrubbing is "active" to avoid blocking normal scrolling.
- Gesture activation and intent:
  - On first movement, records startX/startY.
  - If vertical motion dominates (dy > dx and dy > 8px), it exits early to allow scroll.
  - If horizontal motion reaches a threshold (dx >= 8px and dx >= dy), it marks isActive=true and begins scrubbing.
- Position mapping:
  - Clamps x to [0, width].
  - Computes y via linear interpolation between neighboring points (getYForXFromPoints).
  - Finds the nearest path point index using a small binary search helper (least).
  - Interpolates back to an "originalX" in the source data space, then finds the closest data index.
  - Writes back to context: positionX/Y, originalX/Y; invokes onScrub({ active: true, ox, oy }).
  - On pointer up/leave/cancel, clears state and calls onScrub({ active: false }).
- SVG rendering:
  - Renders a simple <Path> with fill="none", stroke, strokeWidth, strokeLinecap="round".
  - Uses viewBox={`0 0 ${width} ${height}`}.
- DOM prop forwarding (warnings avoided):
  - selectedStrokeWidth and panGestureHandlerProps are intentionally ignored on web to prevent React warnings about unknown DOM props.

Chart line wrapper (ChartLineSection)
- File: packages/app/features/home/charts/shared/components/ChartLineSection.tsx
- Provides a fixed-height (200) chart area and wires up ChartPathProvider, ChartPath, and ChartDot.
- Forwards onScrub from pathProps when present; avoids passing native-only props to DOM on web.
- Sets Path fill="none" to prevent unintended fills.

Type-safety and linting
- Removed all explicit any for event handling; used unknown + type narrowing in handlers.
- Fixed Biome's noExplicitAny by refining event shapes and access paths.
- Avoids passing non-DOM props to web components to keep the console clean.

Testing notes
- On web, test with touch and mouse:
  - Drag horizontally over the chart: the scrub should follow without offset.
  - Small vertical movements should allow the page to scroll; horizontal movements beyond ~8px should activate scrubbing.
  - Leaving the chart area ends scrubbing.
- On native, behavior remains unchanged; Path also uses fill="none".

Additional file references
- UI primitives involved:
  - packages/ui/src/components/AnimatedCharts/charts/linear/ChartPath.web.tsx (web Path)
  - packages/ui/src/components/AnimatedCharts/charts/linear/ChartPathProvider.tsx (shared context)
  - packages/ui/src/components/AnimatedCharts/charts/linear/ChartPath.tsx (native)
