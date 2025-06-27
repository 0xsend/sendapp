import type { ColorTokens } from '@my/ui'
import { type IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Circle, Path, Svg } from 'react-native-svg'

const Base = (props) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      viewBox="0 0 146 146"
      color={color as ColorTokens | undefined}
      width={size ?? 146}
      height={size ?? 146}
      {...rest}
    >
      <Circle cx="73" cy="73" r="73" fill="#0052FF" />
      <Path
        d="M73.323 123.729C101.617 123.729 124.553 100.832 124.553 72.5875C124.553 44.343 101.617 21.4463 73.323 21.4463C46.4795 21.4463 24.4581 42.0558 22.271 68.2887H89.9859V76.8864H22.271C24.4581 103.119 46.4795 123.729 73.323 123.729Z"
        fill="#fff"
      />
    </Svg>
  )
}
const IconBase = memo<IconProps>(themed(Base))
export { IconBase }
