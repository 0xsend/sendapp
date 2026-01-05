import { type IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'
import type { ColorTokens } from '@my/ui'

const HeartOutline = (props) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      width={size ?? 28}
      height={size ?? 28}
      color={color as ColorTokens | undefined}
      viewBox="0 0 20 20"
      fill="none"
      {...rest}
    >
      <Path
        fill="currentColor"
        d="M10 18.35l-1.45-1.32C3.4 12.36 0 9.28 0 5.5 0 2.42 2.42 0 5.5 0 7.24 0 8.91.81 10 2.09 11.09.81 12.76 0 14.5 0 17.58 0 20 2.42 20 5.5c0 3.78-3.4 6.86-8.55 11.54L10 18.35zM5.5 2C3.5 2 2 3.5 2 5.5c0 2.89 3.14 5.74 8 10.03 4.86-4.29 8-7.14 8-10.03C18 3.5 16.5 2 14.5 2c-1.54 0-3.04.99-3.57 2.36h-1.87C8.54 2.99 7.04 2 5.5 2z"
      />
    </Svg>
  )
}
const IconHeartOutline = memo<IconProps>(themed(HeartOutline))
export { IconHeartOutline }
