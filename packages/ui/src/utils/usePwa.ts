import { useState, useEffect } from 'react'
/*
  This function is checks if the device has the display-mode media query set to "standalone".
  This will return true when a user has downloaded the app as a PWA. It's not foolproof, but works in our case.
  It also adds an extra check for if the app is launched via TWA on Android
  Read More: https://stackoverflow.com/questions/41742390/javascript-to-check-if-pwa-or-mobile-web
*/

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
