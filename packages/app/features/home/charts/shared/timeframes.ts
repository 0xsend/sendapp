export const TIMEFRAMES = ['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL'] as const
export type Timeframe = (typeof TIMEFRAMES)[number]

export function getDaysForTimeframe(
  tf: Timeframe
): '1' | '7' | '30' | '90' | '180' | '365' | 'max' {
  switch (tf) {
    case '1D':
      return '1'
    case '1W':
      return '7'
    case '1M':
      return '30'
    case '3M':
      return '90'
    case '6M':
      return '180'
    case '1Y':
      return '365'
    case 'ALL':
      return 'max'
    default:
      return '1'
  }
}

export function getInterpolationRange(tf: Timeframe): number {
  switch (tf) {
    case '1D':
      return 120
    case '1W':
      return 160
    case '1M':
      return 200
    case '3M':
      return 220
    case '6M':
      return 240
    case '1Y':
      return 280
    case 'ALL':
      return 300
    default:
      return 120
  }
}

export function getCgParams(_tf: Timeframe): { interval: string | null; precision: string | null } {
  void _tf
  // unify on higher precision; interval is null for CG market_chart
  return { interval: null, precision: 'full' }
}
