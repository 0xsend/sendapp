import type { ColorTokens } from '@my/ui/types'
import { type IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'

const ArrowUp = (props) => {
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
        d="M11.1008 19.2008V8.25078L6.07578 13.2758L4.80078 12.0008L12.0008 4.80078L19.2008 12.0008L17.9258 13.2758L12.9008 8.25078V19.2008H11.1008Z"
      />
    </Svg>
  )
}
const IconArrowUp = memo<IconProps>(themed(ArrowUp))
export { IconArrowUp }
