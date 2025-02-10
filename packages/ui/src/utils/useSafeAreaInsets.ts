import { useState, useEffect } from 'react'

const DEFAULT_INSETS = { sat: 0, sar: 0, sab: 0, sal: 0 }

const sanitizeSafeAreaInset = (value: string) => {
  if (value.includes('env')) return 0
  const sanitizedInset = value.endsWith('px') ? Number(value.slice(0, -2)) : Number(value)
  return Number.isNaN(sanitizedInset) ? 0 : sanitizedInset
}

let initialized = false
let cachedInsets = DEFAULT_INSETS

export const useSafeAreaInsets = () => {
  const [ready, setReady] = useState(initialized)

  useEffect(() => {
    if (!initialized && typeof window !== 'undefined') {
      const styles = getComputedStyle(document.documentElement)
      cachedInsets = {
        sat: sanitizeSafeAreaInset(styles.getPropertyValue('--sat')),
        sab: sanitizeSafeAreaInset(styles.getPropertyValue('--sab')),
        sar: sanitizeSafeAreaInset(styles.getPropertyValue('--sar')),
        sal: sanitizeSafeAreaInset(styles.getPropertyValue('--sal')),
      }
      initialized = true
      setReady(true)
    }
  }, [])

  return { ...cachedInsets, ready }
}
