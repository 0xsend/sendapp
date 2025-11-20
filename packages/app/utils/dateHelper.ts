export const CommentsTime = (date: Date, locale = 'en') => {
  const now = Date.now()
  const diffMs = date.getTime() - now
  const diffSeconds = Math.round(diffMs / 1000)
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })

  const minutes = Math.round(diffSeconds / 60)
  const hours = Math.round(diffSeconds / 3600)
  const days = Math.round(diffSeconds / 86400)
  const months = Math.round(diffSeconds / 2592000)
  const years = Math.round(diffSeconds / 31536000)

  if (Math.abs(diffSeconds) < 60) {
    return formatter.format(diffSeconds, 'second')
  }
  if (Math.abs(minutes) < 60) {
    return formatter.format(minutes, 'minute')
  }
  if (Math.abs(hours) < 24) {
    return formatter.format(hours, 'hour')
  }
  if (Math.abs(days) < 30) {
    return formatter.format(days, 'day')
  }
  if (Math.abs(months) < 12) {
    return formatter.format(months, 'month')
  }
  return formatter.format(years, 'year')
}

export const adjustUTCDateForTimezone = (date: Date, offset?: number) => {
  const adjustedDate = date

  // Get the timezone offset in minutes
  const timezoneOffset = offset ?? adjustedDate.getTimezoneOffset()

  // Add the timezone offset to the date
  adjustedDate.setMinutes(adjustedDate.getMinutes() + timezoneOffset)

  // Check if the adjusted date is in the next month
  if (adjustedDate.getUTCMonth() !== date.getUTCMonth()) {
    // If so, set it back to the last day of the original month
    // 0 day doesn't exist so it will roll back to the last day of the previous month
    adjustedDate.setUTCDate(0)
  }

  return adjustedDate
}

export const adjustDatePickerDateToTimezone = (date: Date): Date => {
  const timezoneOffsetMinutes = date.getTimezoneOffset()
  const timezoneOffsetMillis = timezoneOffsetMinutes * 60 * 1000
  const adjustedTime = date.getTime() - timezoneOffsetMillis
  return new Date(adjustedTime)
}

/**
 * Checks if two dates are in the same calendar day.
 * @param date1 - The first date to compare.
 * @param date2 - The second date to compare.
 * @returns True if the dates are in the same calendar day, false otherwise.
 */
export const isEqualCalendarDate = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}
