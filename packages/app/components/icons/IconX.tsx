import { ColorTokens } from '@my/ui/types'
import { IconProps, themed } from '@tamagui/helpers-icon'
import * as React from 'react'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'

const X = (props: IconProps) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      color={color as ColorTokens | undefined}
      width={size ?? 32}
      height={size ?? 32}
      viewBox="0 0 32 32"
      {...rest}
    >
      <Path
        d="M8.30006 25.1004L6.90005 23.7004L14.6001 16.0004L6.90005 8.30039L8.30006 6.90039L16.0001 14.6004L23.7001 6.90039L25.1001 8.30039L17.4001 16.0004L25.1001 23.7004L23.7001 25.1004L16.0001 17.4004L8.30006 25.1004Z"
        fill="currentColor"
      />
    </Svg>
  )
}
const IconX = memo(themed(X))
export { IconX }
