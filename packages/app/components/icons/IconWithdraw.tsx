import Svg, { Path, Mask, G } from 'react-native-svg'

import { type IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'

const SIZE_OG = 48
const graphicXYRatio = 8 / 48
const graphicToMaskSize = 32 / 48

const Withdraw = (props) => {
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
      <Path d="M0 8a8 8 0 018-8h32a8 8 0 018 8v32a8 8 0 01-8 8H8a8 8 0 01-8-8V8z" fill="#DE4747" />
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
        <Path d="M15.732 25.2v-2.4h16.534v2.4H15.732z" fill="#fff" />
      </G>
    </Svg>
  )
}
const IconWithdraw = memo<IconProps>(themed(Withdraw))
export { IconWithdraw }
