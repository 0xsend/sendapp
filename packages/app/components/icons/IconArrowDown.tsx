import { ColorTokens } from '@my/ui/types'
import { IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Circle, Defs, LinearGradient, Path, Stop, Svg } from 'react-native-svg'

const ArrowDown = (props: IconProps) => {
  const { size, color, ...rest } = props
  return (
    <Svg width="34" height="34" viewBox="0 0 34 34" fill="none">
      <Circle cx="17" cy="17" r="16.5" fill="#161619" fill-opacity="0.4" />
      <Circle cx="17" cy="17" r="16.5" stroke="url(#paint0_linear_563_1349)" />
      <Path
        d="M16.2931 23.7071C16.6836 24.0976 17.3167 24.0976 17.7073 23.7071L24.0711 17.3431C24.4617 16.9525 24.4617 16.3194 24.0711 15.9288C23.6806 15.5383 23.0474 15.5383 22.6569 15.9289L17.0001 21.5858L11.3432 15.929C10.9527 15.5385 10.3195 15.5385 9.92899 15.929C9.53847 16.3196 9.53848 16.9527 9.92901 17.3432L16.2931 23.7071ZM18 11C18 10.4477 17.5523 9.99999 17 10C16.4477 10 16 10.4477 16 11L18 11ZM18.0002 23L18 11L16 11L16.0002 23L18.0002 23Z"
        fill="white"
      />
      <Defs>
        <LinearGradient
          id="paint0_linear_563_1349"
          x1="20"
          y1="-59.5"
          x2="15"
          y2="54.5"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0.312496" stop-color="white" />
          <Stop offset="1" stop-color="white" stop-opacity="0" />
        </LinearGradient>
      </Defs>
    </Svg>
  )
}
const IconArrowDown = memo(themed(ArrowDown))
export { IconArrowDown }
