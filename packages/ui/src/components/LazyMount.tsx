import { useEffect, useState } from 'react'

interface LazyMountProps {
  /** Once true, children mount and stay mounted forever. Useful for expensive components like bottom sheets. */
  when: boolean
  children: React.ReactNode
}

export function LazyMount({ when, children }: LazyMountProps) {
  const [hasBeenMounted, setHasBeenMounted] = useState(when)

  useEffect(() => {
    if (when) {
      setHasBeenMounted(true)
    }
  }, [when])

  if (!hasBeenMounted) {
    return null
  }

  return children
}
