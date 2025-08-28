import { useState } from 'react'

export function useScrubState() {
  const [price, setPrice] = useState<number | null>(null)
  const [ts, setTs] = useState<number | null>(null)
  const [active, setActive] = useState(false)

  function onScrub(p: { active: boolean; ox?: number; oy?: number }) {
    setActive(!!p.active)
    if (p.active && typeof p.oy === 'number') {
      setPrice(p.oy)
      if (typeof p.ox === 'number') setTs(p.ox)
    } else {
      setPrice(null)
      setTs(null)
    }
  }

  return { active, price, ts, onScrub }
}
