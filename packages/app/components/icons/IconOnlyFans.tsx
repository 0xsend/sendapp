import type { ColorTokens } from '@my/ui'
import { type IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'

const OnlyFans = (props) => {
  const { size, color, ...rest } = props

  return (
    <Svg
      color={color as ColorTokens | undefined}
      width={size ?? 24}
      height={size ?? 24}
      viewBox="0 0 400 400"
      {...rest}
    >
      <Path
        fill="currentColor"
        d="M153.12,112.5a93.75,93.75,0,1,0,93.75,93.75A93.78,93.78,0,0,0,153.12,112.5Zm0,121.88a28.13,28.13,0,1,1,28.13-28.13A28.09,28.09,0,0,1,153.12,234.38Z"
      />
      <Path
        fill="currentColor"
        d="M258.5,182.81c23.82,6.85,51.94,0,51.94,0-8.16,35.63-34,57.94-71.35,60.66a93.55,93.55,0,0,1-86,56.53l28.13-89.39c28.91-91.89,43.73-98.11,112.3-98.11h47.08C332.75,147.19,305.61,173.69,258.5,182.81Z"
      />
    </Svg>
  )
}

const IconOnlyFans = memo<IconProps>(themed(OnlyFans))

export { IconOnlyFans }
