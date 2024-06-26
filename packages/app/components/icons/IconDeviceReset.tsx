import { type IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import Svg, { Mask, Path, G } from 'react-native-svg'
import type { ColorTokens } from '@my/ui'

function DeviceReset(props) {
  const { size = 20, color, ...rest } = props

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      color={color as ColorTokens | undefined}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <Mask maskUnits="userSpaceOnUse" x={0} y={0} width={size} height={size}>
        <Path fill="currentColor" d="M0 0H20V20H0z" />
      </Mask>
      <G mask="url(#a)">
        <Path
          d="M10 17c-1.944 0-3.597-.68-4.958-2.042C3.68 13.598 3 11.944 3 10h1.5c0 1.514.538 2.809 1.615 3.885C7.19 14.962 8.486 15.5 10 15.5c1.514 0 2.809-.538 3.885-1.615C14.962 12.81 15.5 11.514 15.5 10c0-1.514-.538-2.809-1.615-3.885C12.81 5.038 11.514 4.5 10 4.5c-.861 0-1.657.178-2.386.533A5.311 5.311 0 005.77 6.5H8V8H3V3h1.5v2.708A6.948 6.948 0 016.885 3.73 6.745 6.745 0 0110 3c.972 0 1.883.185 2.732.554.849.37 1.588.869 2.216 1.497a7.11 7.11 0 011.498 2.217c.37.85.554 1.76.554 2.732 0 .972-.185 1.883-.554 2.732a7.111 7.111 0 01-1.498 2.216 7.111 7.111 0 01-2.216 1.498c-.85.37-1.76.554-2.732.554zm2.083-4.167L9.25 10V6h1.5v3.375l2.396 2.396-1.063 1.062z"
          fill="currentColor"
        />
      </G>
    </Svg>
  )
}

const IconDeviceReset = memo<IconProps>(themed(DeviceReset))
export { IconDeviceReset }
