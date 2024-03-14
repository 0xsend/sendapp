import { ColorTokens } from '@my/ui/types'
import { IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'

const Refresh = (props: IconProps) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      viewBox="0 0 32 32"
      color={color as ColorTokens | undefined}
      width={size ?? 32}
      height={size ?? 32}
      fill={'none'}
      {...rest}
    >
      <Path
        d="M5.33366 15.9991C5.33366 12.8924 6.69366 10.1058 8.82699 8.15909L12.0003 11.3324V3.33242H4.00033L6.93366 6.26575C4.32033 8.69242 2.66699 12.1458 2.66699 15.9991C2.66699 22.9191 7.93366 28.5991 14.667 29.2658V26.5724C9.41366 25.9191 5.33366 21.4258 5.33366 15.9991ZM29.3337 15.9991C29.3337 9.07909 24.067 3.39909 17.3337 2.73242V5.42576C22.587 6.07909 26.667 10.5724 26.667 15.9991C26.667 19.1058 25.307 21.8924 23.1737 23.8391L20.0003 20.6658V28.6658H28.0003L25.067 25.7324C27.6803 23.3058 29.3337 19.8524 29.3337 15.9991Z"
        fill="currentColor"
      />
    </Svg>
  )
}
const IconRefresh = memo(themed(Refresh))
export { IconRefresh }
