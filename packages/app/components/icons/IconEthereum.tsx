import { XStack } from '@my/ui'
import { ColorTokens } from '@my/ui/types'
import { themed, IconProps } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'

const Ethereum = (props: IconProps) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      viewBox="0 0 40 40"
      color={color as ColorTokens | undefined}
      width={size ?? 12}
      height={size ?? 18}
      {...rest}
    >
      <g clip-path="url(#clip0_563_1431)">
        <Path d="M27.8293 38.4061C37.9939 34.0831 42.7295 22.3385 38.4065 12.1739C34.0835 2.00935 22.339 -2.72621 12.1743 1.59678C2.00975 5.91978 -2.72581 17.6643 1.59719 27.8289C5.92018 37.9935 17.6647 42.729 27.8293 38.4061Z" fill="#101010" />
        <Path d="M20.6247 5.00269V16.0891L29.9946 20.277L20.6247 5.00269Z" fill="#C8C8C8" />
        <Path d="M20.6247 5.00269L11.2493 20.277L20.6247 16.0891V5.00269Z" fill="white" />
        <Path d="M20.6247 27.4633V34.9973L30 22.0206L20.6247 27.4633Z" fill="#C8C8C8" />
        <Path d="M20.6247 34.9973V27.4633L11.2493 22.0261L20.6247 35.0027V34.9973Z" fill="white" />
        <Path d="M20.6247 25.7143L29.9946 20.2716L20.6247 16.0891V25.7143Z" fill="#A0A0A0" />
        <Path d="M11.2493 20.277L20.6247 25.7197V16.0945L11.2493 20.277Z" fill="#C8C8C8" />
      </g>
      <defs>
        <clipPath id="clip0_563_1431">
          <rect width="40" height="40" fill="white" />
        </clipPath>
      </defs>
    </Svg>
  )
}
const IconEthereum = memo(themed(Ethereum))
export { IconEthereum }
