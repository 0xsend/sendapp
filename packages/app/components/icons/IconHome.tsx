import { ColorTokens } from '@my/ui/types'
import { IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'

const Home = (props: IconProps) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      viewBox="0 0 23 24"
      color={color as ColorTokens | undefined}
      width={size ?? 23}
      height={size ?? 24}
      {...rest}
    >
      <Path
        d="M2.83334 22H7.83334V13.6667H15.1667V22H20.1667V9L11.5 2.5L2.83334 9V22ZM0.833336 24V8L11.5 0L22.1667 8V24H13.1667V15.6667H9.83334V24H0.833336Z"
        fill="currentColor"
      />
    </Svg>
  )
}
const IconHome = memo(themed(Home))
export { IconHome }
