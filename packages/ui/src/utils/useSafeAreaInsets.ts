import { useState, useEffect } from 'react'

const sanitizeSafeAreaInset = (value: string) => {
  if (value === '') return null
  if (value.includes('env')) return null
  const sanitizedInset = value.endsWith('px') ? Number(value.slice(0, -2)) : Number(value)
  if (Number.isNaN(sanitizedInset)) return null
  return sanitizedInset
}

export const useSafeAreaInsets = () => {
  const [insets, setInsets] = useState<{
    top: number
    right: number
    bottom: number
    left: number
  } | null>()

  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateInsets = () => {
      const styles = getComputedStyle(document.documentElement)
      const newInsets = {
        top: sanitizeSafeAreaInset(styles.getPropertyValue('--sat')),
        right: sanitizeSafeAreaInset(styles.getPropertyValue('--sar')),
        bottom: sanitizeSafeAreaInset(styles.getPropertyValue('--sab')),
        left: sanitizeSafeAreaInset(styles.getPropertyValue('--sal')),
      }
      const hasInsets = Object.values(newInsets).some((inset) => inset !== null)

      //@ts-expect-error We check for undefined above
      setInsets(hasInsets ? newInsets : null)
    }

    // Initial update
    updateInsets()

    // Update on resize as env() values might change
    window.addEventListener('resize', updateInsets)

    // Create a MutationObserver to watch for CSS variable changes
    const observer = new MutationObserver(updateInsets)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    })

    return () => {
      window.removeEventListener('resize', updateInsets)
      observer.disconnect()
    }
  }, [])

  return insets
}
