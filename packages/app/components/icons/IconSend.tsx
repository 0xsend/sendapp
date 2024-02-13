import { IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { ClipPath, Defs, G, Path, Rect, Svg } from 'react-native-svg'
import { ColorTokens } from '@my/ui/types'

const Send = (props: IconProps) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      width={size ?? 32}
      height={size ?? 32}
      color={color as ColorTokens | undefined}
      viewBox="0 0 32 32"
      fill="none"
      {...rest}
    >
      <G clipPath="url(#clip0_265_2615)">
        <Path
          d="M16 32C24.8691 32 32 24.8691 32 16C32 7.13091 24.8691 0 16 0C7.13091 0 0 7.13091 0 16C0 24.8691 7.13091 32 16 32Z"
          fill="#40FB50"
        />
        <Path d="M9.99457 23.031L14.099 9.12549H16.0124L11.908 23.031H9.99457Z" fill="#122023" />
        <Path
          d="M19.0112 21.518C18.2804 21.518 17.6452 21.4052 17.1055 21.1795C16.5659 20.9539 16.1403 20.6391 15.8304 20.2353C15.519 19.8315 15.337 19.3668 15.2831 18.8412H17.2458C17.2998 19.0624 17.3985 19.2643 17.5403 19.4469C17.6822 19.631 17.8749 19.775 18.1216 19.8805C18.3667 19.9859 18.6582 20.0378 18.9958 20.0378C19.3335 20.0378 19.5894 19.9933 19.7976 19.9042C20.0042 19.8151 20.1568 19.6964 20.2555 19.5494C20.3542 19.4024 20.402 19.245 20.402 19.0772C20.402 18.8248 20.3311 18.6318 20.1892 18.4952C20.0474 18.3587 19.8423 18.2518 19.5756 18.1731C19.3088 18.0944 18.9896 18.0187 18.6181 17.9444C18.2249 17.8717 17.8471 17.7796 17.4817 17.6683C17.1163 17.5584 16.7894 17.4189 16.5011 17.2511C16.2128 17.0833 15.983 16.868 15.815 16.6053C15.6454 16.3425 15.5621 16.0233 15.5621 15.6447C15.5621 15.1829 15.6901 14.7687 15.946 14.4005C16.202 14.0338 16.5736 13.7413 17.0577 13.526C17.5434 13.3108 18.1231 13.2039 18.8 13.2039C19.759 13.2039 20.5253 13.4162 21.0974 13.8408C21.6694 14.2654 22.0055 14.8622 22.1026 15.6283H20.2385C20.1846 15.3344 20.0319 15.1057 19.7806 14.9439C19.5293 14.7821 19.1978 14.7004 18.783 14.7004C18.3683 14.7004 18.0337 14.7761 17.8101 14.9291C17.5866 15.082 17.4756 15.2839 17.4756 15.5348C17.4756 15.7026 17.5434 15.8496 17.6806 15.9757C17.8163 16.1019 18.0152 16.2103 18.2773 16.2979C18.5394 16.387 18.8601 16.4731 19.2425 16.5577C19.8531 16.6735 20.3927 16.8101 20.8615 16.9675C21.3302 17.1249 21.7002 17.3565 21.9731 17.6609C22.246 17.9652 22.3817 18.3958 22.3817 18.9525C22.3925 19.4558 22.2584 19.9027 21.9808 20.2917C21.7033 20.6807 21.3132 20.9821 20.8121 21.1974C20.311 21.4126 19.7112 21.5195 19.0128 21.5195L19.0112 21.518Z"
          fill="#122023"
        />
      </G>
      <Defs>
        <ClipPath id="clip0_265_2615">
          <Rect width="32" height="32" fill="white" />
        </ClipPath>
      </Defs>
    </Svg>
  )
}
const IconSend = memo(themed(Send))
export { IconSend }
