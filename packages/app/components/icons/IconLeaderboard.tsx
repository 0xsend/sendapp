import type { IconProps } from '@tamagui/helpers-icon'
import { themed } from '@tamagui/helpers-icon'
import React, { memo } from 'react'
import { Path, Svg } from 'react-native-svg'
import type { ColorTokens } from '@my/ui/types'

const Icon = (props) => {
  const { color, size, ...otherProps } = props
  return (
    <Svg
      width={size ?? 34}
      color={color as ColorTokens | undefined}
      viewBox="0 0 34 30"
      fill="none"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...otherProps}
    >
      <Path
        fill="currentColor"
        d="M3.114 27.222h7.417V12.778H3.114v14.444Zm10.194 0h7.39V2.778h-7.39v24.444Zm10.167 0h7.416v-11.11h-7.416v11.11ZM.335 30V10H10.53V0h12.945v13.333h10.194V30H.336Z"
      />
    </Svg>
  )
}

Icon.displayName = 'Leaderboard'

export const IconLeaderboard = memo<IconProps>(themed(Icon))
