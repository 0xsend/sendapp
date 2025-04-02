import { memo } from 'react'
import Svg, { Circle, Path } from 'react-native-svg'
import type { ColorTokens } from '@my/ui'
import { type IconProps, themed } from '@tamagui/helpers-icon'

const Moonwell = (props) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      viewBox="0 0 200 200"
      color={color as ColorTokens | undefined}
      width={size ?? 32}
      height={size ?? 32}
      {...rest}
    >
      <Circle cx="100" cy="100" r="100" fill="#2474da" />
      <Path
        d="M84.7 143c-4.8 1.7-9.9 2.7-15.3 2.7-25.2 0-45.7-20.5-45.7-45.7s20.5-45.7 45.7-45.7c5.4 0 10.5 1 15.3 2.7-17.7 6.3-30.4 23.1-30.4 43s12.7 36.7 30.4 43zm45.9-88.7c-5.4 0-10.5 1-15.3 2.7 17.7 6.3 30.4 23.1 30.4 43s-12.7 36.7-30.4 43c4.8 1.7 9.9 2.7 15.3 2.7 25.2 0 45.7-20.5 45.7-45.7s-20.4-45.7-45.7-45.7z"
        fill="#f2f2f2"
      />
    </Svg>
  )
}
const IconMoonwell = memo<IconProps>(themed(Moonwell))
export { IconMoonwell }
