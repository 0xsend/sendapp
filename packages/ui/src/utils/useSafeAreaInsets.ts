import { useLayoutEffect, useState } from 'react'

const sanitizeSafeAreaInset = (value: string) => {
  const sanitizedInset = value.endsWith('px') ? Number(value.slice(0, -2)) : Number(value)
  return Number.isNaN(sanitizedInset) ? 0 : sanitizedInset
}

export const useSafeAreaInsets = () => {
  if (typeof window === 'undefined') return { sat: 0, sar: 0, sab: 0, sal: 0 }

  const [insets, setInsets] = useState({ sat: 0, sar: 0, sab: 0, sal: 0 })

  useLayoutEffect(() => {
    const styles = getComputedStyle(document.documentElement)
    const sat = sanitizeSafeAreaInset(styles.getPropertyValue('--sat')) || 24
    const sab = sanitizeSafeAreaInset(styles.getPropertyValue('--sab')) || 40
    const sar = sanitizeSafeAreaInset(styles.getPropertyValue('--sar'))
    const sal = sanitizeSafeAreaInset(styles.getPropertyValue('--sal'))

    setInsets({ sat, sab, sar, sal })
  }, [])

  return insets
}
