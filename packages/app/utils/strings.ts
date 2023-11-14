export function shorten(str?: string, start: number = 6, end: number = 3): string {
  if (!str || str.length === 0) return ''
  if (start === 0 && end === 0) return str
  if (end === 0) return str.slice(0, start)
  if (start === 0) return str.slice(-end)
  if (start + end >= str.length) return str
  return `${str.slice(0, start)}...${str.slice(-end)}`
}
