import { ColorTokens } from '@my/ui/types'
import { themed } from '@tamagui/helpers-icon'
import type { IconProps } from '@tamagui/helpers-icon'
import { useThemeSetting } from '@tamagui/next-theme'
import * as React from 'react'
import { memo } from 'react'
import { Circle, Defs, LinearGradient, Path, Stop, Svg } from 'react-native-svg'

const IconSendTokenLight = (_props: IconProps) => {
  const { size, color, ...props } = _props
  return (
    <Svg
      color={color as ColorTokens | undefined}
      width={size ?? 20}
      height={size ?? 20}
      viewBox="0 0 20 20"
      fill="none"
      {...props}
    >
      <Path
        d="M14.673 7.81H6.99v.876c0 .175.057.292.113.35.114.117.229.117.346.117h5.563c.345 0 .689.058.918.175.287.117.46.234.63.41.172.174.287.408.401.642.058.233.115.525.115.818v.642c0 .292-.057.526-.115.76-.113.233-.23.467-.401.642-.17.234-.345.35-.63.468-.23.117-.573.175-.918.175H6.788a1.694 1.694 0 01-1.695-1.694h7.493a.672.672 0 000-1.344H6.678a1.753 1.753 0 01-1.753-1.753V7.81h2.066V6.115h5.992c.935 0 1.692.76 1.69 1.694z"
        fill="$primary"
      />
      <Circle cx={10} cy={10} r={9} stroke="$primary" strokeWidth={2} />
    </Svg>
  )
}
const IconSendTokenLightMemo = memo(themed(IconSendTokenLight))
export { IconSendTokenLightMemo as IconSendTokenLight }

const IconSendTokenDark = (_props: IconProps) => {
  const { size, color, ...props } = _props
  return (
    <Svg
      color={color as ColorTokens | undefined}
      width={size ?? 20}
      height={size ?? 20}
      viewBox="0 0 22 20"
      fill="none"
      {...props}
    >
      <Path
        d="M14.673 7.81H6.99v.876c0 .175.057.292.113.35.114.117.229.117.346.117h5.563c.345 0 .689.058.918.175.287.117.46.234.63.41.172.174.287.408.401.642.058.233.115.525.115.818v.642c0 .292-.057.526-.115.76-.113.233-.23.467-.401.642-.17.234-.345.35-.63.468-.23.117-.573.175-.918.175H6.788a1.694 1.694 0 01-1.695-1.694h7.493a.672.672 0 000-1.344H6.678a1.753 1.753 0 01-1.753-1.753V7.81h2.066V6.115h5.992c.935 0 1.692.76 1.69 1.694z"
        fill="url(#paint0_linear_1167_8539)"
      />
      <Circle cx={10} cy={10} r={9.5} stroke="url(#paint1_linear_1167_8539)" />
      <Defs>
        <LinearGradient
          id="paint0_linear_1167_8539"
          x1={9.90054}
          y1={5.62937}
          x2={9.90054}
          y2={13.885}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#FFF8EE" />
          <Stop offset={0.306859} stopColor="#DAC5A5" />
          <Stop offset={0.524492} stopColor="#AB8F76" />
          <Stop offset={0.659198} stopColor="#8F775D" />
          <Stop offset={0.792652} stopColor="#A68B6E" />
          <Stop offset={1} stopColor="#B79A7A" />
        </LinearGradient>
        <LinearGradient
          id="paint1_linear_1167_8539"
          x1={9.80392}
          y1={-1.25}
          x2={9.80391}
          y2={20}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#FFF8EE" />
          <Stop offset={0.306859} stopColor="#DAC5A5" />
          <Stop offset={0.524492} stopColor="#AB8F76" />
          <Stop offset={0.659198} stopColor="#8F775D" />
          <Stop offset={0.792652} stopColor="#A68B6E" />
          <Stop offset={1} stopColor="#B79A7A" />
        </LinearGradient>
      </Defs>
    </Svg>
  )
}
const IconSendTokenDarkMemo = memo(themed(IconSendTokenDark))
export { IconSendTokenDarkMemo as IconSendTokenDark }

const IconSendToken = (_props: IconProps) => {
  const { resolvedTheme } = useThemeSetting()
  const Icon = resolvedTheme === 'dark' ? IconSendTokenDark : IconSendTokenLight
  return <Icon {..._props} />
}
const IconSendTokenMemo = memo(themed(IconSendToken))
export { IconSendTokenMemo as IconSendToken }
