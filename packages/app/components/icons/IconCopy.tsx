import type { ColorTokens } from '@my/ui'
import { type IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'

const Copy = (props) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      viewBox="0 0 16 16"
      color={color as ColorTokens | undefined}
      width={size ?? 16}
      height={size ?? 16}
      fill={'none'}
      {...rest}
    >
      <Path
        d="M13.2727 0H8.36364C6.85982 0 5.63636 1.22345 5.63636 2.72727V4H7.45455V2.72727C7.45455 2.226 7.86236 1.81818 8.36364 1.81818H13.2727C13.774 1.81818 14.1818 2.226 14.1818 2.72727V7.45455C14.1818 7.95582 13.774 8.36364 13.2727 8.36364H12.1818V10.1818H13.2727C14.7765 10.1818 16 8.95836 16 7.45455V2.72727C16 1.22345 14.7765 0 13.2727 0ZM7.63636 5.81818H2.72727C1.22345 5.81818 0 7.04164 0 8.54545V13.2727C0 14.7765 1.22345 16 2.72727 16H7.63636C9.14018 16 10.3636 14.7765 10.3636 13.2727V8.54545C10.3636 7.04164 9.14018 5.81818 7.63636 5.81818ZM8.54545 13.2727C8.54545 13.774 8.13764 14.1818 7.63636 14.1818H2.72727C2.226 14.1818 1.81818 13.774 1.81818 13.2727V8.54545C1.81818 8.04418 2.226 7.63636 2.72727 7.63636H7.63636C8.13764 7.63636 8.54545 8.04418 8.54545 8.54545V13.2727Z"
        fill="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  )
}
const IconCopy = memo<IconProps>(themed(Copy))
export { IconCopy }
