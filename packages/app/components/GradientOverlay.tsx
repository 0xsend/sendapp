import { LinearGradient } from '@my/ui'
import { StyleSheet } from 'react-native'
import { YStack, type YStackProps } from 'tamagui'

export type GradientOverlayProps = Omit<YStackProps, 'start' | 'end'> & {
  /**
   * Array of colors for the gradient
   * @default ['transparent', 'rgba(0, 0, 0, 0.7)']
   */
  colors?: string[]

  /**
   * Starting point of the gradient [x, y] where both x and y are between 0 and 1
   * @default [0, 0]
   */
  start?: [number, number]

  /**
   * Ending point of the gradient [x, y] where both x and y are between 0 and 1
   * @default [0, 1]
   */
  end?: [number, number]
}

/**
 * A reusable gradient overlay component that can be used to create a fade effect
 * over images or content.
 *
 * @example
 * // Basic usage with default props (fade from transparent to black at bottom)
 * <GradientOverlay />
 *
 * @example
 * // Custom colors and height
 * <GradientOverlay
 *   colors={['transparent', '#FF0000AA']}
 *   height="75%"
 * />
 */
export function GradientOverlay({
  colors = ['transparent', 'rgba(0, 0, 0, 0.7)'],
  start = [0, 0],
  end = [0, 1],
  height = '100%',
  borderRadius,
  ...props
}: GradientOverlayProps) {
  return (
    <YStack
      position="absolute"
      bottom={0}
      left={0}
      right={0}
      height={height}
      overflow="hidden"
      {...props}
    >
      <LinearGradient
        start={start}
        end={end}
        fullscreen
        colors={colors}
        borderRadius={borderRadius}
      >
        <YStack style={StyleSheet.absoluteFillObject} />
      </LinearGradient>
    </YStack>
  )
}
