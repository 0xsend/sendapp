export const CommentsTime = (date: Date) => {
  const currentDate: Date = new Date()
  const timeDifference = currentDate.getTime() - date.getTime()
  const secondsAgo = Math.floor(timeDifference / 1000)
  const minutesAgo = Math.floor(secondsAgo / 60)
  const hoursAgo = Math.floor(minutesAgo / 60)
  const daysAgo = Math.floor(hoursAgo / 24)
  const monthsAgo = Math.floor(daysAgo / 30)
  const yearsAgo = Math.floor(monthsAgo / 12)

  if (yearsAgo > 0) {
    return `${yearsAgo} year ago`
  }
  if (monthsAgo > 0) {
    return `${monthsAgo} mon ago`
  }
  if (daysAgo > 1) {
    return `${daysAgo} days ago`
  }
  if (daysAgo > 0) {
    return `${daysAgo} day ago`
  }
  if (hoursAgo > 1) {
    return `${hoursAgo} hours ago`
  }
  if (hoursAgo > 0) {
    return `${hoursAgo} hour ago`
  }

  if (minutesAgo > 0) {
    return `${minutesAgo} min ago`
  }
  return `${secondsAgo} sec ago`
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
