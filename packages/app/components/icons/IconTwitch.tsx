import type { ColorTokens } from '@my/ui'
import { type IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'

const Twitch = (props) => {
  const { size, color, ...rest } = props

  return (
    <Svg
      color={color as ColorTokens | undefined}
      width={size ?? 24}
      height={size ?? 24}
      viewBox="0 0 2400 2800"
      {...rest}
    >
      <Path
        d="M500 0L0 500v1800h600v500l500-500h400l900-900V0H500zm1700 1300-400 400h-400l-350 350v-350H600V200h1600v1100z"
        fill="currentColor"
      />
      <Path d="M1700 550h200v600h-200zm-550 0h200v600h-200z" fill={'currentColor'} />
    </Svg>
  )
}

const IconTwitch = memo<IconProps>(themed(Twitch))

export { IconTwitch }
