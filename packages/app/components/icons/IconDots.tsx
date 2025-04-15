import type { ColorTokens } from '@my/ui'
import { type IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'

const Dots = (props) => {
  const { size, color, ...rest } = props
  return (
    <Svg viewBox="0 0 4 16" width={size ?? 4} height={size ?? 16} fill={'none'} {...rest}>
      <Path
        fill={color as ColorTokens | undefined}
        d="M2 16c-.55 0-1.02-.196-1.413-.588A1.926 1.926 0 0 1 0 14c0-.55.196-1.02.588-1.412A1.926 1.926 0 0 1 2 12c.55 0 1.02.196 1.413.588.391.391.587.862.587 1.412 0 .55-.196 1.02-.587 1.412A1.926 1.926 0 0 1 2 16Zm0-6c-.55 0-1.02-.196-1.413-.588A1.926 1.926 0 0 1 0 8c0-.55.196-1.02.588-1.412A1.926 1.926 0 0 1 2 6c.55 0 1.02.196 1.413.588C3.804 6.979 4 7.45 4 8c0 .55-.196 1.02-.587 1.412A1.926 1.926 0 0 1 2 10Zm0-6C1.45 4 .98 3.804.587 3.413A1.926 1.926 0 0 1 0 2C0 1.45.196.98.588.587A1.926 1.926 0 0 1 2 0c.55 0 1.02.196 1.413.588C3.804.979 4 1.45 4 2c0 .55-.196 1.02-.587 1.413A1.926 1.926 0 0 1 2 4Z"
      />
    </Svg>
  )
}
const IconDots = memo<IconProps>(themed(Dots))
export { IconDots }
