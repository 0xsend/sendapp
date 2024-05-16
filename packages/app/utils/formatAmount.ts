import { floor } from './math'
const defaultSymbols = ['', 'K', 'M', 'B', 'T', 'P', 'E']

interface AbbreviateOptions {
  padding?: boolean
  symbols?: string[]
}

const defaultOptions = {
  padding: true,
  symbols: defaultSymbols,
}

function abbreviateNumber(
  num: number,
  digit = 1,
  options?: AbbreviateOptions | AbbreviateOptions['symbols']
): string {
  // Previous options style
  if (Array.isArray(options)) {
    // biome-ignore lint/style/noParameterAssign: this is a legacy function
    options = { symbols: options }
  }

  const { symbols, padding } = { ...defaultOptions, ...options }

  // handle negatives
  const sign = Math.sign(num) >= 0
  // biome-ignore lint/style/noParameterAssign: this is a legacy function
  num = Math.abs(num)

  // what tier? (determines SI symbol)
  const tier = (Math.log10(num) / 3) | 0

  // if zero, we don't need a suffix
  if (tier === 0) {
    return (
      (!sign ? '-' : '') +
      num.toLocaleString(undefined, {
        maximumFractionDigits: digit,
      })
    )
  }

  // get suffix and determine scale
  const suffix = symbols[tier]
  if (!suffix) throw new RangeError()

  const scale = 10 ** (tier * 3)

  // scale the number
  const scaled = num / scale

  // use the floor function to round down the scaled number to the desired decimal places
  const flooredScaled = floor(scaled, digit)

  // convert the floored number to a string
  let rounded = flooredScaled.toLocaleString(undefined, {
    maximumFractionDigits: digit,
  })

  if (!padding) {
    rounded = Number(rounded).toLocaleString(undefined, {
      maximumFractionDigits: digit,
    })
  }

  // format number and add suffix
  return (!sign ? '-' : '') + rounded + suffix
}

export function formatAmount(
  amount: number | string | undefined,
  maxIntegers = 4,
  maxDecimals = 2
) {
  if (amount === undefined) return ''

  // Check for zero
  if (amount === 0) {
    return Number(amount).toLocaleString(undefined, {
      useGrouping: true,
      maximumFractionDigits: maxDecimals,
      minimumFractionDigits: maxDecimals,
    })
  }

  // remove commas
  if (typeof amount === 'string') {
    // biome-ignore lint/style/noParameterAssign: this is a legacy function
    amount = amount.split(',').join('')
  }

  const digits = amount.toString().split('.', 2)

  // eslint-disable-next-line prefer-const
  const [integers = 0, decimals = 0] = digits.map((s) => Number(s))

  const [integersLength = 0] = digits.map((s) => s.length)

  if ((digits[0] && Number.isNaN(integers)) || (digits[1] && Number.isNaN(decimals))) {
    return abbreviateNumber(0, maxDecimals)
  }

  if (integersLength > maxIntegers) {
    const flooredAmount = floor(Number(amount), maxIntegers + maxDecimals - integersLength)
    const flooredIntegersLength = flooredAmount.toString().split('.')[0]?.length
    if (flooredIntegersLength && flooredIntegersLength >= integersLength) {
      // This means the number has moved to a different tier after flooring,
      // so we abbreviate without flooring.
      return abbreviateNumber(Number(amount), maxDecimals)
    }
    return abbreviateNumber(flooredAmount, maxDecimals)
  }

  const countLeadingZeros = digits[1] && digits[1].length - digits[1].replace(/^0+/, '').length

  const lessThanMin = !integers && countLeadingZeros && countLeadingZeros >= maxDecimals

  return (
    (lessThanMin ? '>' : '') +
    Number(floor(Number(amount), maxDecimals)).toLocaleString(undefined, {
      useGrouping: true,
      minimumFractionDigits: (decimals || 0) < maxDecimals ? decimals : maxDecimals,
      maximumFractionDigits: maxDecimals,
    })
  )
}

export function removeTrailingZeros(amount: string, removeZerosAfterIndex: number) {
  const [integers, decimals] = amount.split('.')
  if (decimals === undefined || decimals.length === 0) {
    return amount
  }

  const [keepZeros, removeZeros] = [
    decimals.substring(0, removeZerosAfterIndex),
    decimals.substring(removeZerosAfterIndex),
  ]

  const removedZeros = removeZeros.replace(/0+$/, '').length

  return `${integers}.${keepZeros}${removedZeros}`
}
