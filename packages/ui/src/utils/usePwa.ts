import { useState, useEffect } from 'react'

export const usePwa = () => {
  const [isPwa, setIsPwa] = useState<boolean | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const checkPwa = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      //@ts-expect-error window.navigator is not defined in the browser
      const isIosStandalone = window?.navigator.standalone
      const isAndroidTwa = document.referrer.includes('android-app://')

      setIsPwa(isStandalone || isIosStandalone || isAndroidTwa)
    }

    checkPwa()

    // Listen for changes in display mode
    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    mediaQuery.addEventListener('change', checkPwa)

    return () => mediaQuery.removeEventListener('change', checkPwa)
  }, [])

  return isPwa
}
