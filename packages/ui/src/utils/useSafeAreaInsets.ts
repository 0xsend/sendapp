export const useSafeAreaInsets = () => {
  // @todo: SSR breaks insets
  if (typeof window === 'undefined') return { sat: 0, sar: 0, sab: 0, sal: 0 }
  return {
    sat: getComputedStyle(document.documentElement).getPropertyValue('--sat'),
    sar: getComputedStyle(document.documentElement).getPropertyValue('--sar'),
    sab: getComputedStyle(document.documentElement).getPropertyValue('--sab'),
    sal: getComputedStyle(document.documentElement).getPropertyValue('--sal'),
  }
}
