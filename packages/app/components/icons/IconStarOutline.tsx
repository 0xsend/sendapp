import { type IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'
import type { ColorTokens } from '@my/ui'

const StarOutline = (props) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      width={size ?? 28}
      height={size ?? 28}
      color={color as ColorTokens | undefined}
      viewBox="0 0 20 19"
      fill="none"
      {...rest}
    >
      <Path
        fill="currentColor"
        d="m6.85 14.825 3.15-1.9 3.15 1.925-.825-3.6 2.775-2.4-3.65-.325-1.45-3.4L8.55 8.5l-3.65.325 2.775 2.425-.825 3.575ZM3.825 19l1.625-7.025L0 7.25l7.2-.625L10 0l2.8 6.625 7.2.625-5.45 4.725L16.175 19 10 15.275 3.825 19Z"
      />
    </Svg>
  )
}
const IconStarOutline = memo<IconProps>(themed(StarOutline))
export { IconStarOutline }
