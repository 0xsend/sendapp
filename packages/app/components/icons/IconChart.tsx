import type { ColorTokens } from '@my/ui'
import { type IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'

const Chart = (props) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      color={color as ColorTokens | undefined}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      {...rest}
    >
      <Path
        fill="currentColor"
        d="M3.5 18.5L2 17L9.5 9.5L13.5 13.5L20.6 5.5L22 6.9L13.5 16.5L9.5 12.5L3.5 18.5Z"
      />
    </Svg>
  )
}
const IconChart = memo<IconProps>(themed(Chart))
export { IconChart }
