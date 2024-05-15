import { type IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Circle, G, Mask, Path, Rect, Svg } from 'react-native-svg'
import type { ColorTokens } from '@my/ui/types'

const Deposit = (props) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      width={size ?? 24}
      height={size ?? 24}
      color={color as ColorTokens | undefined}
      viewBox="0 0 24 24"
      fill="none"
      {...rest}
    >
      {' '}
      <Rect x="1" y="1" width="22" height="22" rx="11" stroke="#122023" strokeWidth="2" />
      <Mask id="mask0_3996_6472" maskUnits="userSpaceOnUse" x="4" y="4" width="16" height="16">
        <Rect x="4.5" y="4.5" width="14.625" height="14.625" fill="#D9D9D9" />
      </Mask>
      <G mask="url(#mask0_3996_6472)">
        <Path
          d="M11.3571 12.6429H6V11.3571H11.3571V6H12.6429V11.3571H18V12.6429H12.6429V18H11.3571V12.6429Z"
          fill="currentColor"
        />
      </G>
    </Svg>
  )
}
const IconDeposit = memo<IconProps>(themed(Deposit))
export { IconDeposit }
