import type { ColorTokens } from '@my/ui/types'
import { type IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'

const Logout = (props) => {
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
        d="M3 21V3H12V5H5V19H12V21H3ZM16 17L14.625 15.55L17.175 13H9V11H17.175L14.625 8.45L16 7L21 12L16 17Z"
      />
    </Svg>
  )
}
const IconLogout = memo<IconProps>(themed(Logout))
export { IconLogout }
