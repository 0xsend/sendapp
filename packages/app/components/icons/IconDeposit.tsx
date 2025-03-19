import Svg, { Path, Mask, G } from 'react-native-svg'

import { type IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'

const SIZE_OG = 48
const graphicXYRatio = 8 / 48
const graphicToMaskSize = 32 / 48

const Deposit = (props) => {
  const { size: sizeProp } = props
  const size = sizeProp < SIZE_OG ? SIZE_OG : sizeProp // unfortunately we can't use smaller than 48
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <Path d="M0 8a8 8 0 018-8h32a8 8 0 018 8v32a8 8 0 01-8 8H8a8 8 0 01-8-8V8z" fill="#86AE80" />
      <Mask
        id="a"
        // @ts-expect-error dunno why this is an error
        style={{
          maskType: 'alpha',
        }}
        maskUnits="userSpaceOnUse"
        x={size * graphicXYRatio}
        y={size * graphicXYRatio}
        width={size * graphicToMaskSize}
        height={size * graphicToMaskSize}
      >
        <Path fill="#D9D9D9" d="M8 8H40V40H8z" />
      </Mask>
      <G mask="url(#a)">
        <Path d="M22.8 25.2H16v-2.4h6.8V16h2.4v6.8H32v2.4h-6.8V32h-2.4v-6.8z" fill="#fff" />
      </G>
    </Svg>
  )
}
const IconDeposit = memo<IconProps>(themed(Deposit))
export { IconDeposit }
