import type { ColorTokens } from '@my/ui'
import { type IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'

const Trash = (props) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      color={color as ColorTokens | undefined}
      width={size}
      height={size}
      viewBox="0 0 20 20"
      {...rest}
    >
      <Path
        d="M5 17V5.5H4V4H8V3H12V4H16V5.5H15V17H5ZM6.5 15.5H13.5V5.5H6.5V15.5ZM8 14H9.5V7H8V14ZM10.5 14H12V7H10.5V14Z"
        fill="currentColor"
      />
    </Svg>
  )
}
const IconTrash = memo<IconProps>(themed(Trash))
export { IconTrash }
