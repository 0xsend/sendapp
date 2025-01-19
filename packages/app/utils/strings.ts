export function shorten(str?: string, start = 6, end = 3): string {
  if (!str || str.length === 0) return ''
  if (start === 0 && end === 0) return str
  if (end === 0) return str.slice(0, start)
  if (start === 0) return str.slice(-end)
  if (start + end >= str.length) return str
  return `${str.slice(0, start)}...${str.slice(-end)}`
}

/**
 * Removes duplicate spaces from a string.
 * @param s - The string to squish.
 * @returns The squished string.
 * @example
 * squish('a b c') // 'a b c'
 * squish('a  b  c') // 'a b c'
 * squish(' a  b  c ') // 'a b c'
 * squish(' a b c ') // 'a b c'
 */
export function squish(s: string) {
  return s.replace(/\s+/g, ' ').trim()
}
