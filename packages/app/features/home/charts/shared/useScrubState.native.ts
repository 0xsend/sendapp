import { useState } from 'react'
import { useChartData } from '@my/ui'
import { useAnimatedReaction, runOnJS } from 'react-native-reanimated'

export function useScrubState() {
  const { isActive, originalX, originalY } = useChartData()
  const [price, setPrice] = useState<number | null>(null)
  const [ts, setTs] = useState<number | null>(null)
  const [active, setActive] = useState(false)

  useAnimatedReaction(
    () => ({ active: isActive.value, ox: originalX.value, oy: originalY.value }),
    (v) => {
      runOnJS(setActive)(!!v.active)
      if (v.active && v.oy !== '') {
        runOnJS(setPrice)(Number(v.oy))
        if (v.ox !== '') runOnJS(setTs)(Number(v.ox))
      } else {
        runOnJS(setPrice)(null)
        runOnJS(setTs)(null)
      }
    }
  )

  return { active, price, ts, onScrub: undefined as unknown as never }
}
