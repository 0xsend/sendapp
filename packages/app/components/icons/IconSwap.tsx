import type { ColorTokens } from '@my/ui/types'
import { type IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'

const Swap = (props) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      fill="none"
      viewBox="0 0 20 20"
      color={color as ColorTokens | undefined}
      width={size ?? 20}
      height={size ?? 20}
      {...rest}
    >
      <Path
        d="M4.25 11V3.825L1.675 6.4L0.25 5L5.25 0L10.25 5L8.825 6.4L6.25 3.825V11H4.25ZM11.25 20L6.25 15L7.675 13.6L10.25 16.175V9H12.25V16.175L14.825 13.6L16.25 15L11.25 20Z"
        fill="currentColor"
      />
    </Svg>
  )
}
const IconSwap = memo<IconProps>(themed(Swap))
export { IconSwap }
