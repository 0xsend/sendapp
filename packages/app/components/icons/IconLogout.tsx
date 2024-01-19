import type { IconProps } from '@tamagui/helpers-icon'
import { themed } from '@tamagui/helpers-icon'
import PropTypes from 'prop-types'
import React, { memo } from 'react'
import {
  Circle as _Circle,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Path,
  Polygon,
  Polyline,
  RadialGradient,
  Rect,
  Stop,
  Svg,
  Text as _Text,
  Use,
} from 'react-native-svg'

const Icon = (props) => {
  const { color = 'black', size = 24, ...otherProps } = props
  return (
    <Svg
      width={'16'}
      height={'28'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#C3AB8E"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...otherProps}
    >
      <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" fill="#C3AB8E" />
      <Polyline points="16 17 21 12 16 7" fill="#C3AB8E" />
      <Line x1="21" x2="9" y1="12" y2="12" fill="#C3AB8E" />
    </Svg>
  )
}

Icon.displayName = 'LogOut'

export const IconLogout = memo<IconProps>(themed(Icon))
