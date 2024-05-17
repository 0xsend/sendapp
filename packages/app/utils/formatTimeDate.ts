export function formatTimeDate(dateStr: string) {
  const date = new Date(dateStr)

  if (Number.isNaN(date.getTime())) {
    return 'Invalid date'
  }

  const formattedTime = date
    .toLocaleTimeString(undefined, { hour: 'numeric', minute: 'numeric', hour12: true })
    .toLowerCase()
    .replace(' ', '')

  const formattedDate = date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return `${formattedTime} - ${formattedDate}`
}
