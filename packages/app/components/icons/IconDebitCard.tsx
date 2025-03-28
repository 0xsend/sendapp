import type { ColorTokens } from '@my/ui/types'
import { type IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'

const DebitCard = (props) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      color={color as ColorTokens | undefined}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      {...rest}
    >
      <Path fill="currentColor" d="M2 20V4H22V20H2ZM4 8H20V6H4V8ZM4 18H20V12H4V18Z" />
    </Svg>
  )
}
const IconDebitCard = memo<IconProps>(themed(DebitCard))
export { IconDebitCard }
