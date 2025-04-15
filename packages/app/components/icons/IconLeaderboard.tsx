import { type IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'
import type { ColorTokens } from '@my/ui'

const Leaderboard = (props) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      width={size ?? 28}
      height={size ?? 28}
      color={color as ColorTokens | undefined}
      viewBox="0 0 20 18"
      fill="none"
      {...rest}
    >
      <Path
        fill="currentColor"
        d="M2 16h4V8H2v8Zm6 0h4V2H8v14Zm6 0h4v-6h-4v6ZM0 18V6h6V0h8v8h6v10H0Z"
      />
    </Svg>
  )
}
const IconLeaderboard = memo<IconProps>(themed(Leaderboard))
export { IconLeaderboard }
