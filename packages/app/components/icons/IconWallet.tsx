import type { ColorTokens } from '@my/ui'
import { type IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'

const Wallet = (props) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      color={color as ColorTokens | undefined}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      {...rest}
    >
      <Path
        fill="currentColor"
        d="M2 20V4H22V20H2ZM4 8H20V6H4V8ZM15.775 14.075L20 10.525V10H4V11.225L15.775 14.075Z"
      />
    </Svg>
  )
}
const IconWallet = memo<IconProps>(themed(Wallet))
export { IconWallet }
