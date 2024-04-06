import { useEffect, useMemo, useState } from 'react'

export type TimeRemaining = {
  days: number
  hours: number
  minutes: number
  seconds: number
  diffInMs: number
}

export function useTimeRemaining(targetDate?: Date, interval = 1000): TimeRemaining {
  const [timeRemaining, setTimeRemaining] = useState(
    useMemo(() => getTimeRemaining(targetDate), [targetDate])
  )

  useEffect(() => {
    setTimeRemaining(getTimeRemaining(targetDate))
    const id = setInterval(() => {
      setTimeRemaining(getTimeRemaining(targetDate))
    }, interval)

    return () => clearInterval(id)
  }, [targetDate, interval])

  return timeRemaining
}

export function getTimeRemaining(targetDate?: Date): TimeRemaining {
  const now = new Date()
  const target = targetDate ? new Date(targetDate) : new Date()

  // Calculate the time difference in milliseconds
  const diffInMs = target.getTime() - now.getTime()
  let timeDifference = diffInMs

  // Check if the target date has already passed
  if (timeDifference <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      diffInMs: 0,
    }
  }

  // Calculate days, hours, minutes, and seconds
  const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24))
  timeDifference -= days * 1000 * 60 * 60 * 24

  const hours = Math.floor(timeDifference / (1000 * 60 * 60))
  timeDifference -= hours * 1000 * 60 * 60

  const minutes = Math.floor(timeDifference / (1000 * 60))
  timeDifference -= minutes * 1000 * 60

  const seconds = Math.floor(timeDifference / 1000)

  return {
    days,
    hours,
    minutes,
    seconds,
    diffInMs,
  }
}
