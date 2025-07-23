import type { ColorTokens } from '@my/ui'
import { type IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'

const Youtube = (props) => {
  const { size, color, ...rest } = props

  return (
    <Svg
      color={color as ColorTokens | undefined}
      width={size ?? 24}
      height={size ?? 24}
      preserveAspectRatio="xMidYMid meet"
      viewBox="0 0 24 24"
      {...rest}
    >
      <Path fill="currentColor" d="M8 5v14l11-7z" />
    </Svg>
  )
}

const IconYoutube = memo<IconProps>(themed(Youtube))

export { IconYoutube }
