export const CommentsTime = (date: Date) => {
  const currentDate: Date = new Date()
  // @ts-expect-error -> TS doesn't allow arithematic operation on 'date' type
  const timeDifference = currentDate - date
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

export const adjustMidnightToTimezone = (date: Date): Date => {
  const timezoneOffsetMinutes = date.getTimezoneOffset()
  const timezoneOffsetMillis = timezoneOffsetMinutes * 60 * 1000
  const adjustedTime = date.getTime() - timezoneOffsetMillis
  return new Date(adjustedTime)
}

export const formatDateToLongForm = (date?: Date): string => {
  if (!date) {
    return ''
  }

  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date provided.')
  }

  const day = date.getDate()
  const month = date.toLocaleString('en-US', { month: 'long' })
  const year = date.getFullYear()

  return `${day} ${month} ${year}`
}

export const formatDateToLongFormWithoutYear = (date?: Date): string => {
  if (!date) {
    return ''
  }

  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date provided.')
  }

  const day = date.getDate()
  const month = date.toLocaleString('en-US', { month: 'long' })

  return `${day} ${month}`
}
