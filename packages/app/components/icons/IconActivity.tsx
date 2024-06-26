import type { ColorTokens } from '@my/ui'
import { type IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'

const aspectRatio = 28 / 22

const Activity = (props) => {
  const { size, color, ...rest } = props

  const height = size / aspectRatio
  const width = size

  return (
    <Svg
      color={color as ColorTokens | undefined}
      width={width}
      height={height}
      viewBox="0 0 28 22"
      {...rest}
    >
      <Path
        d="M7.33334 21.6666L0.666672 14.9999L7.33334 8.33325L9.2 10.2333L5.76667 13.6666H15.3333V16.3333H5.76667L9.2 19.7666L7.33334 21.6666ZM20.6667 13.6666L18.8 11.7666L22.2333 8.33325H12.6667V5.66659H22.2333L18.8 2.23325L20.6667 0.333252L27.3333 6.99992L20.6667 13.6666Z"
        fill="currentColor"
      />
    </Svg>
  )
}

const IconActivity = memo<IconProps>(themed(Activity))

export { IconActivity }
