import type { ColorTokens } from '@my/ui'
import { type IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'

const TikTok = (props) => {
  const { size, color, ...rest } = props

  return (
    <Svg
      color={color as ColorTokens | undefined}
      width={size ?? 24}
      height={size ?? 24}
      viewBox="0 0 24 24"
      {...rest}
    >
      <Path
        d="M19.321 5.562a5.123 5.123 0 0 1-.443-.258 6.228 6.228 0 0 1-1.137-.966c-.849-.966-1.248-2.09-1.223-3.298h-3.142v13.35c-.034 1.355-.688 2.613-1.797 3.459-1.108.845-2.519 1.123-3.88.764a4.654 4.654 0 0 1-2.535-2.071 4.498 4.498 0 0 1-.394-3.814c.294-1.042.94-1.958 1.821-2.578a4.754 4.754 0 0 1 3.028-.759v-3.187a7.932 7.932 0 0 0-5.055 1.282 7.542 7.542 0 0 0-3.053 4.319 7.353 7.353 0 0 0 .646 6.222 7.595 7.595 0 0 0 4.138 3.384 7.764 7.764 0 0 0 6.33-.789 7.572 7.572 0 0 0 2.93-2.843 7.34 7.34 0 0 0 1.066-3.836V8.79a9.15 9.15 0 0 0 5.346 1.719V7.383a6.122 6.122 0 0 1-2.64-1.82z"
        fill="currentColor"
      />
    </Svg>
  )
}

const IconTikTok = memo<IconProps>(themed(TikTok))

export { IconTikTok }
