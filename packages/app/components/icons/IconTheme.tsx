import type { ColorTokens } from '@my/ui/types'
import { type IconProps, themed } from '@tamagui/helpers-icon'
import * as React from 'react'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'

const Theme = (props: IconProps) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      width={size ?? 16}
      height={size ?? 28}
      color={color as ColorTokens | undefined}
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <Path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" fill="currentColor" />
    </Svg>
  )
}
const IconTheme = memo(themed(Theme))
export { IconTheme }
