import type { ColorTokens } from '@my/ui/types'
import { type IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'

const ExclamationCircle = (props) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      color={color as ColorTokens | undefined}
      width={size ?? 24}
      height={size ?? 24}
      viewBox="0 0 17 17"
      fill="none"
      {...rest}
    >
      <Path
        fill="currentColor"
        d="M8.496 12c.21 0 .39-.072.535-.214a.714.714 0 0 0 .219-.532.736.736 0 0 0-.214-.535.714.714 0 0 0-.532-.219.736.736 0 0 0-.535.214.714.714 0 0 0-.219.532c0 .21.071.39.214.535.143.146.32.219.532.219ZM7.75 9h1.5V4h-1.5v5Zm.756 7a7.81 7.81 0 0 1-3.11-.625 8.064 8.064 0 0 1-2.552-1.719 8.065 8.065 0 0 1-1.719-2.551A7.819 7.819 0 0 1 .5 7.99c0-1.104.208-2.14.625-3.105a8.066 8.066 0 0 1 4.27-4.26A7.819 7.819 0 0 1 8.51 0a7.75 7.75 0 0 1 3.105.625 8.082 8.082 0 0 1 4.26 4.265 7.77 7.77 0 0 1 .625 3.104 7.81 7.81 0 0 1-.625 3.11 8.063 8.063 0 0 1-1.719 2.552 8.081 8.081 0 0 1-2.546 1.719A7.77 7.77 0 0 1 8.506 16ZM8.5 14.5c1.806 0 3.34-.632 4.604-1.896C14.368 11.34 15 9.806 15 8s-.632-3.34-1.896-4.604C11.84 2.132 10.306 1.5 8.5 1.5s-3.34.632-4.604 1.896C2.632 4.66 2 6.194 2 8s.632 3.34 1.896 4.604C5.16 13.868 6.694 14.5 8.5 14.5Z"
      />
    </Svg>
  )
}
const IconExclamationCircle = memo<IconProps>(themed(ExclamationCircle))
export { IconExclamationCircle }
