import type { IconProps } from '@tamagui/helpers-icon'
import { themed } from '@tamagui/helpers-icon'
import React, { memo } from 'react'
import { Line, Path, Polyline, Svg } from 'react-native-svg'
import type { ColorTokens } from '@my/ui/types'

const Icon = (props: IconProps) => {
  const { color, size, ...otherProps } = props
  return (
    <Svg
      width={size ?? 16}
      height={size ?? 28}
      color={color as ColorTokens | undefined}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...otherProps}
    >
      <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" fill="currentColor" />
      <Polyline points="16 17 21 12 16 7" fill="currentColor" />
      <Line x1="21" x2="9" y1="12" y2="12" fill="currentColor" />
    </Svg>
  )
}

Icon.displayName = 'LogOut'

export const IconLogout = memo<IconProps>(themed(Icon))
