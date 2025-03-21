import type { ColorTokens } from '@my/ui/types'
import { type IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'

const Swap = (props) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      fill="none"
      viewBox="0 0 16 20"
      color={color as ColorTokens | undefined}
      width={size ?? 20}
      height={size ?? 20}
      {...rest}
    >
      <Path
        d="M4 11L4 3.825L1.425 6.4L0 5L5 0L10 5L8.575 6.4L6 3.825L6 11H4ZM11 20L6 15L7.425 13.6L10 16.175V9H12V16.175L14.575 13.6L16 15L11 20Z"
        fill="currentColor"
      />
    </Svg>
  )
}
const IconSwap = memo<IconProps>(themed(Swap))
export { IconSwap }
