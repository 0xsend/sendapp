# Token Price Charts — Migration Status (React Native + React Native Web)

Scope
- Repo: sendapp-charts (this worktree is detached at origin/main)
- Consumer screen: packages/app/features/home/TokenChartSection.tsx
- Chart internals: packages/ui/src/components/AnimatedCharts
- Original design reference: ../../Rainbow/rainbow-charts-migration/RAINBOW_CHARTS_MIGRATION.md

What’s implemented (grounded file references)

Data fetching and shaping
- CoinGecko market_chart/range hook
  - packages/app/utils/coin-gecko/index.tsx
    - useTokenMarketChartRange: builds the /coins/{id}/market_chart/range URL with vs_currency, from, to (+ optional interval/precision), Zod-validated response, and a staleTime that scales by range.
    - toChartPointsFromPrices: maps CG [timestamp, price] → { x, y } points in ascending order.
- Smoothing/densifying
  - packages/ui/src/components/AnimatedCharts/interpolations/monotoneCubicInterpolation.ts
    - Monotone cubic interpolation to produce a target number of points (e.g., 100), with optional includeExtremes.
    - Relies on helpers/extremesHelpers.ts to retain local extrema when requested.

Chart rendering primitives
- ChartPathProvider
  - packages/ui/src/components/AnimatedCharts/charts/linear/ChartPathProvider.tsx
  - Creates linear scales, builds a simple polyline path string, exposes Reanimated shared values (progress, isActive, positions) via ChartContext.
  - Stablecoin y-range handling (clamps around ~1.0 if >95% of y values near 1).
- ChartPath (gesture + animated stroke)
  - packages/ui/src/components/AnimatedCharts/charts/linear/ChartPath.tsx
  - LongPressGestureHandler scrubbing; animates selected stroke color/width; derives y-for-x via linear interpolation of path points.
- ChartDot (last-point pulse + touch dot)
  - packages/ui/src/components/AnimatedCharts/charts/linear/ChartDot.tsx
  - Pulsing last-point dot; touch-follow dot while scrubbing; timings and sequences via Reanimated.
- Shared helpers
  - useChartData, usePrevious, extremesHelpers, + public index exports under AnimatedCharts.

Feature composition
- packages/app/features/home/TokenChartSection.tsx
  - Default 1D window (from = now − 86400) using useTokenMarketChartRange.
  - Maps to points and computes a smoothed series via monotoneCubicInterpolation({ range: 100, includeExtremes: true }).
  - Renders ChartPathProvider + ChartPath + ChartDot in a Card; shows last price and a simple 1D change pill.

Intentional differences vs. Rainbow (for now)
- No redash/d3-path parsing; path is a simple polyline string.
- Haptics disabled (hapticsEnabled={false}).
- No ExtremeLabels overlay component.
- Single timeframe (1D) only; no segmented control yet.

What’s still missing to match the target UI and ensure RN + Web robustness

User-facing gaps
1) Timeframe tabs (1D, 1W, 1M, 3M, 6M, 1Y, ALL)
   - Status: not implemented; TokenChartSection hardcodes 1D.
   - Need: segmented control; compute from/to per tab; tune interpolation density (e.g., 100 for 1D, higher for long ranges).
   - Example: Rainbow “Price Overview” tabs + range mapping (see RAINBOW_CHARTS_MIGRATION.md references section).

2) Scrubbing-driven labels (current price and timestamp under finger)
   - Status: not wired into the UI; ChartPath sets originalX/originalY and positionX/Y.
   - Need: read from useChartData within TokenChartSection and render live values while isActive is true; fallback to last point otherwise.
   - Example: Rainbow LineChart composition reacting to scrubbing.

3) Path morph animation between ranges
   - Status: no morph; current/previousPath are computed but not morphed.
   - Options (must follow an existing pattern): crossfade between paths; unify sample counts before swap; or adopt d3-interpolate-path as Rainbow does.

4) Extreme labels overlay
   - Status: not implemented; helpers exist.
   - Need: overlay to label min/max within selected range.
   - Example: Rainbow ExtremeLabels usage.

Platform and robustness gaps
5) Width measurement and responsiveness (esp. web)
   - Status: uses Dimensions.get('window').width; can overflow within a column layout.
   - Need: measure container width (onLayout/ResizeObserver) and pass to provider/path; use an existing measurement hook/pattern already in the repo.

6) RN Web + Next configuration verification
   - Ensure app roots wrap with GestureHandlerRootView (native + web), babel.config.js includes 'react-native-reanimated/plugin' last, and the web build transpiles/handles react-native-svg and reanimated as required by existing project patterns. Avoid SSR execution of worklets.

7) Haptics parity (optional)
   - Status: disabled.
   - If parity is desired, wire existing haptics utility with Platform guards.

Why this aligns with Rainbow
- Composition mirrors Rainbow: Provider + Path + Dot with upstream smoothing and optional extremes. The simplified linear path is acceptable so long as scrubbing, timeframe switching, and measurement are correct.
- Source guidance: ../../Rainbow/rainbow-charts-migration/RAINBOW_CHARTS_MIGRATION.md (sections “What to port”, “Composition”, “Data shaping”).

Next steps (prioritized, no new patterns)
P0
- Add timeframe tabs; wire from/to to useTokenMarketChartRange; adjust interpolation range per tab in TokenChartSection. Cite Rainbow tabs behavior.
- Add scrubbing label reactions using useChartData (originalX/originalY, isActive) in TokenChartSection. Cite Rainbow LineChart behavior.
- Replace Dimensions.get('window').width with measured container width in the chart container using an existing measurement pattern.

P1
- Choose a path swap animation approach based on an existing example (crossfade or interpolate-path) and implement accordingly.
- Optional ExtremeLabels overlay above the SVG using extremesHelpers.

P2
- Haptics parity (optional), guarded by Platform where supported.
- Tests that stabilize animations (pulse/timing guarded as needed following existing test patterns).

References (local)
- Feature surface: packages/app/features/home/TokenChartSection.tsx
- Data hooks: packages/app/utils/coin-gecko/index.tsx (useTokenMarketChartRange, toChartPointsFromPrices)
- AnimatedCharts internals: packages/ui/src/components/AnimatedCharts/**

Reference (original)
- ../../Rainbow/rainbow-charts-migration/RAINBOW_CHARTS_MIGRATION.md

