import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg'
import type { ViewStyle, StyleProp } from 'react-native'
import { useTheme } from 'tamagui'

export interface GradientConfig {
  colors: { color: string; opacity: number }[]
  start?: { x: number; y: number }
  end?: { x: number; y: number }
}

interface Props extends GradientConfig {
  style?: StyleProp<ViewStyle>
  children?: React.ReactNode
}

export const MyLinearGradient = ({
  colors: colorsProp,
  start = { x: 0, y: 0 },
  end = { x: 0.42, y: 1 },
  style,
}: Props) => {
  const gradientId = colorsProp.map((c) => `${c.color}-${c.opacity}`).join('-')

  const theme = useTheme()

  const colors =
    colorsProp?.map((c) => {
      return { color: (theme[c.color]?.val as string) ?? c.color, opacity: c.opacity }
    }) || ([] as { color: string; opacity: number }[])

  return (
    <Svg style={style} width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
      <Defs>
        <LinearGradient id={gradientId} x1={start.x} y1={start.y} x2={end.x} y2={end.y}>
          {colors.map((c, i) => (
            <Stop
              // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
              key={i}
              offset={`${(i / (colors.length - 1)) * 100}%`}
              stopColor={c.color === 'transparent' ? 'white' : c.color}
              stopOpacity={c.color === 'transparent' ? 0 : c.opacity}
            />
          ))}
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100" height="100" fill={`url(#${gradientId})`} />
    </Svg>
  )
}
