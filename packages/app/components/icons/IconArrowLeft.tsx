import { ColorTokens } from '@my/ui/types'
import { IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'

const ArrowLeft = (props: IconProps) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      viewBox="0 0 32 32"
      color={color as ColorTokens | undefined}
      width={size ?? 32}
      height={size ?? 32}
      fill={'none'}
      {...rest}
    >
      <Path
        d="M8.275 17.125L17.575 26.425L16 28L4 16L16 4L17.575 5.575L8.275 14.875H28V17.125H8.275Z"
        fill="currentColor"
      />
    </Svg>
  )
}
const IconArrowLeft = memo(themed(ArrowLeft))
export { IconArrowLeft }
