import type { ColorTokens } from '@my/ui/types'
import { type IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'

const ArrowRight = (props) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      viewBox="0 0 20 20"
      color={color as ColorTokens | undefined}
      width={size ?? 20}
      height={size ?? 20}
      fill={'none'}
      {...rest}
    >
      <Path
        d="M14.2917 10.625L9.12508 15.7917L10.0001 16.6667L16.6667 10L10.0001 3.33337L9.12508 4.20837L14.2917 9.37504H3.33341V10.625H14.2917Z"
        fill="currentColor"
      />
    </Svg>
  )
}
const IconArrowRight = memo<IconProps>(themed(ArrowRight))
export { IconArrowRight }
