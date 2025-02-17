import { useState, useEffect } from 'react'

const sanitizeSafeAreaInset = (value: string) => {
  if (typeof window === 'undefined') return null
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
  } | null>(null)

  useEffect(() => {
    // Force a fresh read by temporarily removing and re-adding the CSS variables
    const root = document.documentElement
    const originalStyle = root.style.cssText

    // Clear and immediately reset CSS variables to force a fresh read
    root.style.setProperty('--sat', 'env(safe-area-inset-top)')
    root.style.setProperty('--sar', 'env(safe-area-inset-right)')
    root.style.setProperty('--sab', 'env(safe-area-inset-bottom)')
    root.style.setProperty('--sal', 'env(safe-area-inset-left)')

    const updateInsets = () => {
      const styles = getComputedStyle(document.documentElement)
      const newInsets = {
        top: sanitizeSafeAreaInset(styles.getPropertyValue('--sat')),
        right: sanitizeSafeAreaInset(styles.getPropertyValue('--sar')),
        bottom: sanitizeSafeAreaInset(styles.getPropertyValue('--sab')),
        left: sanitizeSafeAreaInset(styles.getPropertyValue('--sal')),
      }
      const hasInsets = Object.values(newInsets).some((inset) => inset !== undefined)
      //@ts-expect-error We check for undefined above
      setInsets(hasInsets ? newInsets : null)
    }

    updateInsets()

    window.addEventListener('resize', updateInsets)

    const observer = new MutationObserver(updateInsets)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    })

    return () => {
      window.removeEventListener('resize', updateInsets)
      observer.disconnect()
      root.style.cssText = originalStyle
    }
  }, [])

  return insets
}
