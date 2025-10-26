import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
/**
 * Prefetches routes manually where Next.js/Solito Link component cannot be used
 */
export const usePrefetch = (href?: string) => {
  const router = useRouter()
  useEffect(() => {
    if (href) {
      router.prefetch(href)
    }
  }, [href, router])
}
