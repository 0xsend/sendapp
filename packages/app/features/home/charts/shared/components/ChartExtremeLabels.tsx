import { Paragraph, YStack } from '@my/ui'
import { useMemo, useState } from 'react'
import formatAmount from 'app/utils/formatAmount'
import { useChartData } from '@my/ui'

export function ChartExtremeLabels({ decimals, active }: { decimals: number; active: boolean }) {
  const { currentPath, width, height } = useChartData() as unknown as {
    currentPath: { points: { x: number; y: number; originalX: number; originalY: number }[] } | null
    width: number
    height: number
  }

  // Measure actual label sizes to position precisely across themes/densities
  const [maxSize, setMaxSize] = useState({ w: 72, h: 20 })
  const [minSize, setMinSize] = useState({ w: 72, h: 20 })
  const spacing = 6

  const labels = useMemo(() => {
    if (!currentPath || !currentPath.points || currentPath.points.length === 0) return null

    let minP = currentPath.points[0]
    let maxP = currentPath.points[0]
    for (const p of currentPath.points) {
      if (!p) continue
      if (p.originalY < (minP?.originalY ?? Number.POSITIVE_INFINITY)) minP = p
      if (p.originalY > (maxP?.originalY ?? Number.NEGATIVE_INFINITY)) maxP = p
    }
    if (!minP || !maxP) return null

    const computeX = (p: typeof minP, w: number) =>
      Math.min(Math.max(p.x - w / 2, 0), Math.max(0, width - w))

    // Max: prefer above; if not enough space, place below; else center within chart
    const maxAboveTop = maxP.y - maxSize.h - spacing
    const maxBelowTop = maxP.y + spacing
    const maxTop =
      maxAboveTop >= 0
        ? maxAboveTop
        : maxBelowTop + maxSize.h <= height
          ? maxBelowTop
          : Math.min(Math.max(maxP.y - maxSize.h / 2, 0), height - maxSize.h)
    const maxLeft = computeX(maxP, maxSize.w)

    // Min: prefer below; if not enough space, place above; else center within chart
    const minBelowTop = minP.y + spacing
    const minAboveTop = minP.y - minSize.h - spacing
    const minTop =
      minBelowTop + minSize.h <= height
        ? minBelowTop
        : minAboveTop >= 0
          ? minAboveTop
          : Math.min(Math.max(minP.y - minSize.h / 2, 0), height - minSize.h)
    const minLeft = computeX(minP, minSize.w)

    return {
      max: { x: maxLeft, y: maxTop, text: `$${formatAmount(maxP.originalY, 9, decimals)}` },
      min: { x: minLeft, y: minTop, text: `$${formatAmount(minP.originalY, 9, decimals)}` },
    }
  }, [currentPath, width, height, decimals, maxSize, minSize])

  if (!labels || active) return null

  return (
    <YStack style={{ position: 'absolute', left: 0, top: 0, width, height }} pointerEvents="none">
      <YStack
        position="absolute"
        left={labels.max.x}
        top={labels.max.y} // this offset works for now
        bg={'$color2'}
        px={'$1.5'}
        py={'$0.5'}
        br={'$2'}
        onLayout={(e) => {
          const { width: w, height: h } = e.nativeEvent.layout
          if (w && h && (w !== maxSize.w || h !== maxSize.h)) setMaxSize({ w, h })
        }}
      >
        <Paragraph size={'$3'} color={'$color12'} fontWeight={500}>
          {labels.max.text}
        </Paragraph>
      </YStack>
      <YStack
        position="absolute"
        left={labels.min.x}
        top={labels.min.y}
        bg={'$color2'}
        px={'$1.5'}
        py={'$0.5'}
        br={'$2'}
        onLayout={(e) => {
          const { width: w, height: h } = e.nativeEvent.layout
          if (w && h && (w !== minSize.w || h !== minSize.h)) setMinSize({ w, h })
        }}
      >
        <Paragraph size={'$3'} color={'$color12'} fontWeight={500}>
          {labels.min.text}
        </Paragraph>
      </YStack>
    </YStack>
  )
}
