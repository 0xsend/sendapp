/*
  This function is checks if the device has the display-mode media query set to "standalone".
  This will return true when a user has downloaded the app as a PWA. It's not foolproof, but works in our case.
  It also adds an extra check for if the app is launched via TWA on Android
  Read More: https://stackoverflow.com/questions/41742390/javascript-to-check-if-pwa-or-mobile-web
*/

export const usePwa = () => {
  if (typeof window !== 'undefined') {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      //@ts-expect-error window.navigator is not defined in the browser
      window?.navigator.standalone ||
      document.referrer.includes('android-app://')
    )
  }
  return false
}
