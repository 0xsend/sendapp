import { ColorTokens } from '@my/ui/types'
import { IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'

const Home = (props: IconProps) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      fill="none"
      viewBox="0 0 20 20"
      color={color as ColorTokens | undefined}
      width={size ?? 20}
      height={size ?? 20}
      {...rest}
    >
      <Path
        d="M4.58301 16.25H7.70801V11.0417H12.2913V16.25H15.4163V8.125L9.99967 4.0625L4.58301 8.125V16.25ZM3.33301 17.5V7.5L9.99967 2.5L16.6663 7.5V17.5H11.0413V12.2917H8.95801V17.5H3.33301Z"
        fill="currentColor"
      />
    </Svg>
  )
}
const IconHome = memo(themed(Home))
export { IconHome }
