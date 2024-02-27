import { ColorTokens } from '@my/ui/types'
import { IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { ClipPath, Defs, G, Path, Rect, Svg } from 'react-native-svg'

const Ethereum = (props: IconProps) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      viewBox="0 0 32 32"
      color={color as ColorTokens | undefined}
      width={size ?? 32}
      height={size ?? 32}
      {...rest}
    >
      <Path
        d="M0 16C0 7.16344 7.16344 0 16 0V0C24.8366 0 32 7.16344 32 16V16C32 24.8366 24.8366 32 16 32V32C7.16344 32 0 24.8366 0 16V16Z"
        fill="#E9E9E9"
      />
      <G clipPath="url(#clip0_265_2608)">
        <Path
          d="M15.9978 4L15.8415 4.51639V19.5007L15.9978 19.6524L23.1536 15.541L15.9978 4Z"
          fill="#343434"
        />
        <Path d="M15.9979 4L8.8421 15.541L15.9979 19.6524V12.3795V4Z" fill="#8C8C8C" />
        <Path
          d="M15.9978 20.9695L15.9097 21.0738V26.4116L15.9978 26.6616L23.1579 16.8601L15.9978 20.9695Z"
          fill="#3C3C3B"
        />
        <Path d="M15.9979 26.6617V20.9695L8.8421 16.8601L15.9979 26.6617Z" fill="#8C8C8C" />
        <Path d="M15.9978 19.6525L23.1535 15.5411L15.9978 12.3796V19.6525Z" fill="#141414" />
        <Path d="M8.8421 15.5411L15.9978 19.6525V12.3796L8.8421 15.5411Z" fill="#393939" />
      </G>
      <Defs>
        <ClipPath id="clip0_265_2608">
          <Rect width="14.3158" height="22.6667" fill="white" transform="translate(8.8421 4)" />
        </ClipPath>
      </Defs>
    </Svg>
  )
}
const IconEthereum = memo(themed(Ethereum))
export { IconEthereum }
