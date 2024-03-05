import { ColorTokens } from '@my/ui/types'
import { IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'

const Check = (props: IconProps) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      viewBox="0 0 24 24"
      color={color as ColorTokens | undefined}
      width={size ?? 24}
      height={size ?? 24}
      fill={'none'}
      {...rest}
    >
      <Path
        d="M18.6156 5.25L9.44431 13.7833L5.56572 9.63201L3 12.0433L9.26605 18.75L21 7.84229L18.6156 5.25Z"
        fill="#122023"
      />
    </Svg>
  )
}
const IconCheck = memo(themed(Check))
export { IconCheck }
