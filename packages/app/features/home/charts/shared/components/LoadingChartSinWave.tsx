import { useMemo, useState } from 'react'
import { Path, Svg } from 'react-native-svg'
import { Dimensions, type LayoutChangeEvent } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useFrameCallback,
  type FrameInfo,
} from 'react-native-reanimated'
import { useThemeName, View } from '@my/ui'

const CHART_HEIGHT = 200
const WAVE_PERIOD = 160
const WAVE_AMPLITUDE = 35
const ANIMATION_DURATION = 4000

const calculateAnimationValue = (elapsed: number): number => {
  'worklet'
  const progress = (elapsed % ANIMATION_DURATION) / ANIMATION_DURATION
  return -WAVE_PERIOD * progress
}

export function LoadingChartSinWave() {
  const [width, setWidth] = useState<number>(0)
  const translateX = useSharedValue(0)
  const startTime = useSharedValue<number | null>(null)
  const theme = useThemeName()
  const isDark = theme?.startsWith('dark')
  const strokeColor = isDark ? 'rgba(64, 251, 80, 0.4)' : 'rgba(0, 0, 0, 0.3)'

  useFrameCallback((frameInfo: FrameInfo) => {
    'worklet'
    if (startTime.value === null) {
      startTime.value = frameInfo.timestamp
    }

    const elapsed = frameInfo.timestamp - startTime.value
    translateX.value = calculateAnimationValue(elapsed)
  })

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width
    if (typeof w === 'number' && w > 0 && w !== width) {
      setWidth(w)
    }
  }

  // Calculate how many wave periods we need to cover the width + extra for seamless looping
  const waveWidth = useMemo(() => {
    if (width === 0) return Dimensions.get('window').width
    // We need at least width + WAVE_PERIOD to ensure seamless looping
    return Math.ceil((width + WAVE_PERIOD * 2) / WAVE_PERIOD) * WAVE_PERIOD
  }, [width])

  // Make sure it starts and ends at the same phase for seamless looping
  const wavePath = useMemo(() => {
    const centerY = CHART_HEIGHT / 2
    const points: string[] = []
    const step = 1

    for (let x = 0; x <= waveWidth; x += step) {
      const y = centerY + WAVE_AMPLITUDE * Math.sin((x / WAVE_PERIOD) * 2 * Math.PI)
      points.push(`${x},${y}`)
    }

    return `M ${points.join(' L ')}`
  }, [waveWidth])

  const animatedStyle = useAnimatedStyle(() => {
    'worklet'
    return {
      transform: [{ translateX: translateX.value }],
    }
  }, [translateX])

  const containerWidth = width || Dimensions.get('window').width

  return (
    <View
      style={{
        width: containerWidth,
        height: CHART_HEIGHT,
        overflow: 'hidden',
      }}
      onLayout={onLayout}
    >
      <Animated.View style={animatedStyle}>
        <Svg width={waveWidth} height={CHART_HEIGHT}>
          <Path
            d={wavePath}
            stroke={strokeColor}
            strokeWidth={2.5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </Animated.View>
    </View>
  )
}
