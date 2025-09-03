import React, { useMemo } from 'react'
import { Dimensions } from 'react-native'
import { useSharedValue } from 'react-native-reanimated'
import {
  type CallbackType,
  ChartContext,
  CurveType,
  type DataType,
  type PathData,
  type PathScales,
  type Point,
} from '../../helpers/ChartContext'
import { findYExtremes } from '../../helpers/extremesHelpers'
import { usePrevious } from '../../helpers/usePrevious'

const { width: WIDTH } = Dimensions.get('window')

const HEIGHT = 146.5
interface ChartPathProviderProps {
  data: DataType
  color: string
  selectedColor?: string
  width?: number
  height?: number
  yRange?: [number, number]
  children: React.ReactNode
  endPadding?: number
}

function detectStablecoin(yValues: number[]): boolean {
  if (!yValues.length) return false

  const threshold = 0.01
  const closeToOneCount = yValues.filter((y) => Math.abs(y - 1.0) < threshold).length

  // If at least 95% of points are close to 1.0, consider it a stablecoin
  // this handles cases where there are random deviations from the 1.0 line
  return closeToOneCount / yValues.length > 0.95
}

function createLinearScale(domain: [number, number], range: [number, number]) {
  const [d0, d1] = domain
  const [r0, r1] = range
  const denom = d1 - d0 === 0 ? 1 : d1 - d0
  const m = (r1 - r0) / denom
  return (value: number) => r0 + (value - d0) * m
}

function getScales({ data, width, height, yRange }: CallbackType): PathScales {
  const x = data.points.map((item) => item.x)
  const y = data.points.map((item) => item.y)

  const smallestX = Math.min(...x)
  const greatestX = Math.max(...x)

  const isStablecoin = detectStablecoin(y)

  let smallestY: number
  let greatestY: number

  if (Array.isArray(yRange)) {
    smallestY = yRange[0]
    greatestY = yRange[1]
  } else if (isStablecoin) {
    smallestY = Math.round(Math.min(...y))
    greatestY = Math.round(Math.max(...y))
  } else {
    smallestY = Math.min(...y)
    greatestY = Math.max(...y)

    const range = greatestY - smallestY
    const padding = Math.max(range * 0.005, smallestY * 0.005)
    smallestY = smallestY - padding
    greatestY = greatestY + padding
  }

  const scaleX = createLinearScale([smallestX, greatestX], [0, width])
  const scaleY = createLinearScale([smallestY, greatestY], [height, 0])

  return {
    scaleX,
    scaleY,
  }
}

function createPath({ data, width, height, yRange }: CallbackType): PathData {
  if (!data.points.length) {
    return {
      data: [],
      parsed: null,
      path: '',
      points: [],
    }
  }

  const { scaleY, scaleX } = getScales({
    data,
    height,
    width,
    yRange,
  })

  const points: (Point & { originalX: number; originalY: number })[] = []

  const sortedPoints = [...data.points].sort((a, b) => a.x - b.x)
  const { greatestY, smallestY } = findYExtremes(sortedPoints)
  const smallestX = sortedPoints[0]
  const greatestX = sortedPoints[sortedPoints.length - 1]

  for (const point of sortedPoints) {
    points.push({
      originalX: point.x,
      originalY: point.y,
      x: scaleX(point.x),
      y: scaleY(point.y),
    })
  }

  // Build a simple linear path (M x,y L x,y ...)
  let path = ''
  for (let i = 0; i < sortedPoints.length; i++) {
    const p = sortedPoints[i]
    if (!p) continue
    const cmd = i === 0 ? 'M' : 'L'
    path += `${cmd}${scaleX(p.x)},${scaleY(p.y)} `
  }
  path = path.trim()

  // parsed path not used without redash; keep null placeholder
  const parsed = null

  return {
    data: data.nativePoints || sortedPoints,
    greatestX,
    greatestY,
    parsed,
    path,
    points,
    smallestX,
    smallestY,
  }
}

export const ChartPathProvider = React.memo<ChartPathProviderProps>(
  ({
    children,
    data,
    color,
    selectedColor = color,
    width = WIDTH,
    height = HEIGHT,
    yRange,
    endPadding = 0,
  }) => {
    const chartPathWidth = width - endPadding
    // path interpolation animation progress
    const progress = useSharedValue(1)

    // animated scale of the dot
    const dotScale = useSharedValue(1)

    // gesture state
    const isActive = useSharedValue(false)

    // current (according to finger position) item of data fields
    const originalX = useSharedValue('')
    const originalY = useSharedValue('')

    // gesture event state
    const state = useSharedValue(0)

    // position of the dot
    const positionX = useSharedValue(0)
    const positionY = useSharedValue(-1)

    const currentPath = useMemo(() => {
      return data.points.length > 1
        ? createPath({ data, height, width: chartPathWidth, yRange })
        : null
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, height, chartPathWidth, yRange])
    const previousPath = usePrevious(currentPath) ?? null

    const value = useMemo(() => {
      const ctx = {
        currentPath,
        data,
        dotScale,
        height,
        isActive,
        originalX,
        originalY,
        positionX,
        positionY,
        previousPath,
        progress,
        state,
        width: chartPathWidth,
        stroke: color,
        selectedStroke: selectedColor,
        color,
      }

      if (currentPath) {
        const { smallestX, smallestY, greatestX, greatestY } = currentPath

        return {
          ...ctx,
          greatestX,
          greatestY,
          smallestX,
          smallestY,
        }
      }

      return ctx
    }, [
      data,
      currentPath,
      previousPath,
      chartPathWidth,
      height,
      dotScale,
      isActive,
      state,
      originalX,
      originalY,
      positionX,
      positionY,
      progress,
      color,
      selectedColor,
    ])

    return <ChartContext.Provider value={value}>{children}</ChartContext.Provider>
  }
)

ChartPathProvider.displayName = 'ChartPathProvider'
