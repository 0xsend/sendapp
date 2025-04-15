import { type IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'
import type { ColorTokens } from '@my/ui'

const Receive = (props) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      width={size ?? 42}
      height={size ?? 42}
      color={color as ColorTokens | undefined}
      viewBox="0 0 42 42"
      fill="none"
      {...rest}
    >
      <Path
        d="M41 21C41 32.0457 32.0457 41 21 41C9.9543 41 1 32.0457 1 21C1 9.9543 9.9543 1 21 1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M20 21C20 21.5523 20.4477 22 21 22H30C30.5523 22 31 21.5523 31 21C31 20.4477 30.5523 20 30 20H22V12C22 11.4477 21.5523 11 21 11C20.4477 11 20 11.4477 20 12V21ZM41.7071 1.70711C42.0976 1.31658 42.0976 0.683417 41.7071 0.292893C41.3166 -0.0976311 40.6834 -0.0976311 40.2929 0.292893L41.7071 1.70711ZM21.7071 21.7071L41.7071 1.70711L40.2929 0.292893L20.2929 20.2929L21.7071 21.7071Z"
        fill="currentColor"
      />
    </Svg>
  )
}
const IconReceive = memo<IconProps>(themed(Receive))
export { IconReceive }
