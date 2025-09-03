export type ChartDataPoint = { x: number; y: number }

// Ported to TS from rainbow migration implementation
import { addExtremesIfNeeded } from '../helpers/extremesHelpers'

export default function monotoneCubicInterpolation({
  data,
  range,
  includeExtremes = false,
  removePointsSurroundingExtremes = true,
}: {
  data: ChartDataPoint[]
  range?: number
  includeExtremes?: boolean
  removePointsSurroundingExtremes?: boolean
}): ChartDataPoint[] {
  if (!data || data.length < 2 || !range || range <= 0) {
    return []
  }

  const acc = data.reduce(
    (acc, curr) => {
      acc.x.push(curr.x)
      acc.y.push(curr.y)
      return acc
    },
    {
      x: [] as number[],
      y: [] as number[],
    }
  )
  const x = acc.x
  const y = acc.y
  const alpha: number[] = []
  const beta: number[] = []
  const delta: number[] = []
  const dist: number[] = []
  const m: number[] = []
  const tau: number[] = []

  const n = x.length

  for (let i = 0; i < n - 1; i++) {
    const x0 = x[i]
    const x1 = x[i + 1]
    const y0 = y[i]
    const y1 = y[i + 1]
    if (x0 === undefined || x1 === undefined || y0 === undefined || y1 === undefined) {
      continue
    }
    delta[i] = (y1 - y0) / (x1 - x0)
    if (i > 0) {
      m[i] = ((delta[i - 1] ?? 0) + (delta[i] ?? 0)) / 2
    }
  }

  m[0] = delta[0] ?? 0
  m[n - 1] = delta[n - 2] ?? 0
  let toFix: number[] = []

  for (let i = 0; i < n - 1; i++) {
    if (delta[i] === 0) {
      toFix.push(i)
    }
  }

  for (const i of toFix) {
    m[i] = m[i + 1] = 0
  }

  for (let i = 0; i < n - 1; i++) {
    alpha[i] = (m[i] ?? 0) / (delta[i] ?? 1)
    beta[i] = (m[i + 1] ?? 0) / (delta[i] ?? 1)
    dist[i] = (alpha[i] ?? 0) ** 2 + (beta[i] ?? 0) ** 2
    tau[i] = 3 / Math.sqrt(dist[i] ?? 1)
  }

  toFix = []

  for (let i = 0; i < n - 1; i++) {
    if ((dist[i] ?? 0) > 9) {
      toFix.push(i)
    }
  }

  for (const i of toFix) {
    m[i] = (tau[i] ?? 0) * (alpha[i] ?? 0) * (delta[i] ?? 0)
    m[i + 1] = (tau[i] ?? 0) * (beta[i] ?? 0) * (delta[i] ?? 0)
  }

  const _x = x.slice(0, n)
  const _y = y.slice(0, n)
  const _m = m

  const firstValue = _x[0] ?? 0
  const lastValue = _x[_x.length - 1] ?? 0
  const res: ChartDataPoint[] = []
  for (let j = 0; j < range; j++) {
    const interpolatedValue = firstValue + ((lastValue - firstValue) * j) / (range - 1)

    let i = _x.length - 2
    for (; i >= 0; i--) {
      const xi = _x[i]
      if (xi !== undefined && xi <= interpolatedValue) {
        break
      }
    }
    const idx = Math.max(0, i)
    const xi0 = _x[idx]
    const xi1 = _x[idx + 1]
    const yi0 = _y[idx]
    const yi1 = _y[idx + 1]
    const mi0 = _m[idx]
    const mi1 = _m[idx + 1]
    if (
      xi0 === undefined ||
      xi1 === undefined ||
      yi0 === undefined ||
      yi1 === undefined ||
      mi0 === undefined ||
      mi1 === undefined
    ) {
      continue
    }

    const h = xi1 - xi0
    const t = (interpolatedValue - xi0) / h
    const t2 = t ** 2
    const t3 = t ** 3
    const h00 = 2 * t3 - 3 * t2 + 1
    const h10 = t3 - 2 * t2 + t
    const h01 = -2 * t3 + 3 * t2
    const h11 = t3 - t2
    const yy = h00 * yi0 + h10 * h * mi0 + h01 * yi1 + h11 * h * mi1

    res.push({ x: interpolatedValue, y: yy })
  }

  return addExtremesIfNeeded(res, data, includeExtremes, removePointsSurroundingExtremes)
}
