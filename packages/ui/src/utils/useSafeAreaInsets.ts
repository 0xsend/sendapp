import { useEffect, useState } from 'react'

const sanitizeSafeAreaInset = (value: string) => {
  // Handle env() function values
  if (value.includes('env')) return 0
  const sanitizedInset = value.endsWith('px') ? Number(value.slice(0, -2)) : Number(value)
  return Number.isNaN(sanitizedInset) ? 0 : sanitizedInset
}

export const useSafeAreaInsets = () => {
  const [insets, setInsets] = useState({ sat: 0, sar: 0, sab: 0, sal: 0 })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateInsets = () => {
      // Force a repaint to ensure env() values are calculated
      document.documentElement.style.display = 'none'
      document.documentElement.offsetHeight // Force reflow
      document.documentElement.style.display = ''

      const styles = getComputedStyle(document.documentElement)
      const sat = sanitizeSafeAreaInset(styles.getPropertyValue('--sat')) || 24
      const sab = sanitizeSafeAreaInset(styles.getPropertyValue('--sab')) || 40
      const sar = sanitizeSafeAreaInset(styles.getPropertyValue('--sar'))
      const sal = sanitizeSafeAreaInset(styles.getPropertyValue('--sal'))

      setInsets({ sat, sab, sar, sal })
    }

    // Initial update with a slight delay to ensure CSS is loaded
    setTimeout(updateInsets, 100)

    // Update on resize
    window.addEventListener('resize', updateInsets)
    return () => window.removeEventListener('resize', updateInsets)
  }, [])

  return insets
}
