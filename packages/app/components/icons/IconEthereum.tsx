import type { ColorTokens } from '@my/ui'
import { type IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { ClipPath, Defs, G, Path, Rect, Svg } from 'react-native-svg'

const Ethereum = (props) => {
  const { size = 32, color, ...rest } = props
  return (
    <Svg
      viewBox="0 0 32 32"
      color={color as ColorTokens | undefined}
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <Path
        d="M0 16C0 7.16344 7.16344 0 16 0V0C24.8366 0 32 7.16344 32 16V16C32 24.8366 24.8366 32 16 32V32C7.16344 32 0 24.8366 0 16V16Z"
        fill="#E9E9E9"
        // fill="currentColor"
      />
      <G clipPath="url(#clip0_265_2608)">
        <Path
          d="M15.9978 4L15.8415 4.51639V19.5007L15.9978 19.6524L23.1536 15.541L15.9978 4Z"
          fill="#343434"
          // fill="currentColor"
        />
        <Path
          d="M15.9979 4L8.8421 15.541L15.9979 19.6524V12.3795V4Z"
          fill="#8C8C8C"
          // fill="currentColor"
        />
        <Path
          d="M15.9978 20.9695L15.9097 21.0738V26.4116L15.9978 26.6616L23.1579 16.8601L15.9978 20.9695Z"
          fill="#3C3C3B"
          // fill="currentColor"
        />
        <Path
          d="M15.9979 26.6617V20.9695L8.8421 16.8601L15.9979 26.6617Z"
          fill="#8C8C8C"
          // fill="currentColor"
        />
        <Path
          d="M15.9978 19.6525L23.1535 15.5411L15.9978 12.3796V19.6525Z"
          fill="#141414"
          // fill="currentColor"
        />
        <Path
          d="M8.8421 15.5411L15.9978 19.6525V12.3796L8.8421 15.5411Z"
          fill="#393939"
          // fill="currentColor"
        />
      </G>
      <Defs>
        <ClipPath id="clip0_265_2608">
          <Rect width="14.3158" height="22.6667" fill="white" transform="translate(8.8421 4)" />
        </ClipPath>
      </Defs>
    </Svg>
  )
}
const IconEthereum = memo<IconProps>(themed(Ethereum))
export { IconEthereum }
