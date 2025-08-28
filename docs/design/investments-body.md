# InvestmentsBody – Portfolio Header and Holdings Spec

Template mirrored from docs/design/send-app-onboarding.md to follow the repository’s existing design-doc style. That example correlates because it documents UX flows and screen structure for the app in markdown with headings and scoped, non-code guidance.

## Summary

This document describes the implemented Investments screen body composed of:
- packages/app/features/home/InvestmentsBalanceCard.tsx
  - Exports two card components:
    - InvestmentsBalanceCard (Home): toggles the investments subscreen onPress.
    - InvestmentsPortfolioCard (InvestmentsBody): no onPress; does not toggle the subscreen.
- InvestmentsBody in packages/app/features/home/screen.tsx

Implemented behavior:
- Two card components are used to avoid unintended toggling on wide screens:
  - Home: InvestmentsBalanceCard (wraps HomeBodyCard) toggles the investments subscreen onPress.
  - Investments subscreen: InvestmentsPortfolioCard (wraps Card) has no onPress; clicking the card does not close the subscreen.
- The card header shows “Portfolio Value”. The primary Invest button appears in the card footer (label: “INVEST”) and opens the CoinSheet (on web the sheet handle reads “New Investments”).
- A portfolio-wide weighted 7d percentage pill is displayed next to the balance (green for positive, red for negative), implemented by InvestmentsBalanceCard.Aggregate.
- A weekly USD delta summary shows “+$X.XX this week”, implemented by InvestmentsBalanceCard.WeeklyDelta (aggregated via 7d percent; falls back to 24h if 7d is unavailable).
- Three summary cards appear below the header: Today (implemented), Total Return (placeholder), Investment (placeholder).
- A “Your Holdings” section header precedes the holdings list.

Note: This updates the earlier plan-only draft; the features above are implemented.

## In-Scope

- Split components for home vs investments subscreen to control onPress behavior:
  - Home uses InvestmentsBalanceCard (toggles subscreen onPress).
  - InvestmentsBody uses InvestmentsPortfolioCard (no onPress; does not toggle).
- Card header “Portfolio Value” and Invest button in the card footer that opens CoinSheet.
- Weighted 7d percent badge (InvestmentsBalanceCard.Aggregate).
- Weekly delta “this week” in USD (InvestmentsBalanceCard.WeeklyDelta).
- “Today” summary card using 24h changes (USD delta + 24h percent pill).
- “Your Holdings” label above the list.
- Market data via useMultipleTokensMarketData, using 7d where available and falling back to 24h.

## Out of Scope (for now)

- Implementing Total Return and Investment calculations (placeholders only).
- Visual polish beyond the elements listed above.
- Navigation changes beyond opening the CoinSheet.

## UI Details

### Header & Card
- Header title: “Portfolio Value”.
- Component split & onPress behavior:
  - Home: InvestmentsBalanceCard wraps HomeBodyCard and toggles the investments subscreen onPress (web: query param; native: router push).
  - InvestmentsBody: InvestmentsPortfolioCard wraps Card and has no onPress; the subscreen remains open when clicking the card or Invest button.
- The Invest button is rendered in the card footer; onPress sets isSheetOpen(true) to open the CoinSheet.
  - Reference: packages/app/features/home/screen.tsx (InvestmentsBody) and InvestmentsBalanceCard.Footer/Button.
- Weighted 7d percent pill is shown beside the portfolio balance.
  - Styling: tinted green/red pill as in InvestmentsBalanceCard.Aggregate.

### Summary Cards
- Today (implemented)
  - Shows the portfolio USD delta over the past 24h and a small percent pill for the weighted 24h change.
  - Calculation: For each owned investment asset, usd_value * pct_change_24h; sum across assets for the USD delta. The 24h percent is a value-weighted average.
- Total Return (placeholder)
  - Placeholder component and copy.
- Investment (placeholder)
  - Placeholder component and copy.

### Your Holdings Label
- Section header “Your Holdings” above the list, followed by a card that renders InvestmentsBalanceList when loaded.

## Data & Hooks

- useMultipleTokensMarketData is used for market data across investment tokens.
  - 7d percentage is read from price_change_percentage_7d_in_currency when present; otherwise falls back to 24h.
  - 24h percentage is used by the “Today” card in InvestmentsBody.
- Backward compatibility: existing 24h consumers continue to work unchanged.

## Aggregations

### Weighted Percent (7d)
- Weighted 7d percentage of the portfolio computed by value-weighting each asset’s 7d percent change.
  - Reference: packages/app/features/home/InvestmentsBalanceCard.tsx (InvestmentsAggregate).

### Today USD Delta (24h) and Weighted 24h %
- USD delta: sum over assets of (usd_value * pct_change_24h/100).
- Weighted 24h percent: value-weighted average of pct_change_24h across owned assets.
  - Reference: packages/app/features/home/screen.tsx (InvestmentsBody) compute block for delta24hUSD and pct24h.

## Implementation Summary

- Split components:
  - InvestmentsBalanceCard (Home): toggles subscreen onPress.
  - InvestmentsPortfolioCard (InvestmentsBody): no onPress.
- Card header and footer implemented (Portfolio Value + INVEST button to open CoinSheet).
- Aggregates implemented:
  - Weighted 7d percent pill (Aggregate).
  - “This week” USD delta (WeeklyDelta).
  - “Today” card (24h USD delta + 24h weighted percent).
- Total Return and Investment: placeholders only.
- Holdings section header present; list renders InvestmentsBalanceList.

## Acceptance Criteria

- HomeBody (web wide screens): clicking InvestmentsBalanceCard toggles the investments subscreen on/off (unchanged).
- InvestmentsBody (web wide screens): clicking InvestmentsPortfolioCard does not close the subscreen; Invest opens CoinSheet and closing it keeps the subscreen open.
- Invest button opens CoinSheet (“New Investments” handle on web).
- A weighted 7d change pill renders next to the balance in the header card.
- “Today” card shows a 24h USD delta and a weighted 24h percent.
- Total Return and Investment cards render as placeholders.
- “Your Holdings” label precedes the token list.
- Market data uses 7d where available and falls back to 24h; 24h consumers remain functional.

## References (examples used)
- packages/app/features/home/InvestmentsBalanceCard.tsx
  - Exports InvestmentsBalanceCard (Home) and InvestmentsPortfolioCard (InvestmentsBody) via withStaticProperties, sharing Body/Footer/Aggregate/WeeklyDelta/Balance.
  - Balance: displays total investment USD balance; respects privacy and loading states.
  - Aggregate: computes and renders the weighted 7d percentage pill.
  - WeeklyDelta: shows “+$X.XX this week” using 7d percent aggregation.
- packages/app/features/home/screen.tsx (InvestmentsBody)
  - Composes the header card, summary cards, holdings list, and CoinSheet.
  - Computes delta24hUSD and pct24h for the “Today” card.
- packages/app/features/home/TokenAbout.tsx and TokenKeyMetrics.tsx
  - Section heading styles used as references for “Your Holdings”.

