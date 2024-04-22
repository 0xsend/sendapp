import type { ColorTokens } from '@my/ui/types'
import { type IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'

const Caret = (props: IconProps) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      viewBox="0 0 11 8"
      fill="none"
      width={size ?? 11}
      height={size ?? 8}
      color={color as ColorTokens | undefined}
      {...rest}
    >
      <Path stroke="currentColor" strokeLinecap="square" strokeWidth={2} d="m2 1.5 3.5 4 3.5-4" />
    </Svg>
  )
}
const IconCaret = memo(themed(Caret))
export { IconCaret }
