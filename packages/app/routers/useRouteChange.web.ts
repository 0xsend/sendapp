import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

export const useRouteChange = () => {
  const router = useRouter()
  const [isRouteChanging, setIsRouteChanging] = useState(false)

  useEffect(() => {
    const handleStart = () => {
      setIsRouteChanging(true)
    }

    const handleComplete = () => {
      setIsRouteChanging(false)
    }

    router.events.on('routeChangeStart', handleStart)
    router.events.on('routeChangeComplete', handleComplete)
    router.events.on('routeChangeError', handleComplete)

    return () => {
      router.events.off('routeChangeStart', handleStart)
      router.events.off('routeChangeComplete', handleComplete)
      router.events.off('routeChangeError', handleComplete)
    }
  }, [router])

  return isRouteChanging
}
