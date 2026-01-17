import { useState, useEffect } from 'react'
/*
  This function is checks if the device has the display-mode media query set to "standalone".
  This will return true when a user has downloaded the app as a PWA. It's not foolproof, but works in our case.
  It also adds an extra check for if the app is launched via TWA on Android
  Read More: https://stackoverflow.com/questions/41742390/javascript-to-check-if-pwa-or-mobile-web
*/

const checkPwaSync = (): boolean => {
  if (typeof window === 'undefined') return false

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
  // @ts-expect-error navigator.standalone is iOS-specific
  const isIosStandalone = window?.navigator?.standalone === true
  const isAndroidTwa = document.referrer.includes('android-app://')

  return isStandalone || isIosStandalone || isAndroidTwa
}

export const usePwa = (): boolean => {
  // Initialize with synchronous check to avoid layout flicker
  const [isPwa, setIsPwa] = useState<boolean>(() => checkPwaSync())

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Re-check in case SSR value differs from client
    const currentValue = checkPwaSync()
    if (currentValue !== isPwa) {
      setIsPwa(currentValue)
    }

    // Listen for changes in display mode
    const mediaQuery = window.matchMedia('(display-mode: standalone)')

    const handleChange = () => {
      setIsPwa(checkPwaSync())
    }

    // Safari fallback: addListener is deprecated but needed for older Safari < 14
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange)
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange)
      } else if (mediaQuery.removeListener) {
        mediaQuery.removeListener(handleChange)
      }
    }
  }, [isPwa])

  return isPwa
}
