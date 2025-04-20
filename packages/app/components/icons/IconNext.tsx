import { type IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'
import type { ColorTokens } from '@my/ui'

const Next = (props) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      width={size ?? 24}
      height={size ?? 24}
      color={color as ColorTokens | undefined}
      viewBox="0 0 24 24"
      fill="none"
      {...rest}
    >
      <Path
        d="M7.79999 19.2L16.8 12L7.79999 4.79995"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  )
}
const IconNext = memo<IconProps>(themed(Next))
export { IconNext }
