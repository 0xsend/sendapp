import React, { memo } from 'react'
import type { IconProps } from '@tamagui/helpers-icon'
import { Svg, Circle as _Circle, Path } from 'react-native-svg'
import { themed } from '@tamagui/helpers-icon'
import type { ColorTokens } from '@my/ui'

const Icon = (props) => {
  const { color = 'black', size = 24, ...otherProps } = props
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color as ColorTokens | undefined}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...otherProps}
    >
      <_Circle cx="12" cy="12" r="10" stroke={'currentColor'} />
      <Path d="M12 16v-4" stroke={'currentColor'} />
      <Path d="M12 8h.01" stroke={'currentColor'} />
    </Svg>
  )
}

Icon.displayName = 'Info'

export const IconInfoCircle = memo<IconProps>(themed(Icon))
