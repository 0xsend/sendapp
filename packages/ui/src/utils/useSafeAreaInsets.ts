import { useMemo } from 'react'

const sanitizeSafeAreaInset = (value: string) => {
  const sanitizedInset = value.endsWith('px') ? Number(value.slice(0, -2)) : Number(value)
  return Number.isNaN(sanitizedInset) ? 0 : sanitizedInset
}

// The values will only be recalculated if the component is unmounted and remounted
export const useSafeAreaInsets = () => {
  // @todo: SSR breaks insets

  if (typeof window === 'undefined') return { sat: 0, sar: 0, sab: 0, sal: 0 }
  return useMemo(() => {
    const sat = sanitizeSafeAreaInset(
      getComputedStyle(document.documentElement).getPropertyValue('--sat')
    )
    console.log(getComputedStyle(document.documentElement).getPropertyValue('--sat'))

    const sab = sanitizeSafeAreaInset(
      getComputedStyle(document.documentElement).getPropertyValue('--sab')
    )

    const sar = sanitizeSafeAreaInset(
      getComputedStyle(document.documentElement).getPropertyValue('--sar')
    )
    const sal = sanitizeSafeAreaInset(
      getComputedStyle(document.documentElement).getPropertyValue('--sal')
    )

    return {
      sat: !sat ? 24 : sat,
      sab: !sab ? 40 : sab,
      sar,
      sal,
    }
  }, [])
}
