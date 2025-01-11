import type { ColorTokens } from '@my/ui/types'
import { type IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'

const Slash = (props) => {
  const { size, color, ...rest } = props

  return (
    <Svg
      fill="none"
      viewBox="0 0 12 24"
      color={color as ColorTokens | undefined}
      width={size ?? 20}
      height={size ?? 20}
      {...rest}
    >
      <Path d="M0.980469 24L7.82853 0H11.021L4.17297 24H0.980469Z" fill="currentColor" />
    </Svg>
  )
}

const IconSlash = memo<IconProps>(themed(Slash))
export { IconSlash }
