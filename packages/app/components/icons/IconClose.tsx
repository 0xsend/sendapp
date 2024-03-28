import type { ColorTokens } from '@my/ui/types'
import { type IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'

const Close = (props: IconProps) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      viewBox="0 0 24 24"
      color={color as ColorTokens | undefined}
      width={size ?? 24}
      height={size ?? 24}
      {...rest}
    >
      <Path
        fill="currentColor"
        d="M10.7879 12L8.3639 9.57597C8.20777 9.41431 8.12137 9.1978 8.12332 8.97306C8.12528 8.74832 8.21542 8.53333 8.37434 8.37441C8.53326 8.21549 8.74825 8.12535 8.97299 8.12339C9.19773 8.12144 9.41424 8.20784 9.5759 8.36397L11.9999 10.788L14.4239 8.36397C14.503 8.28211 14.5976 8.21681 14.7021 8.17188C14.8067 8.12696 14.9192 8.10332 15.033 8.10233C15.1468 8.10134 15.2597 8.12303 15.365 8.16612C15.4703 8.20922 15.566 8.27287 15.6465 8.35335C15.727 8.43383 15.7907 8.52953 15.8337 8.63487C15.8768 8.74021 15.8985 8.85308 15.8975 8.96689C15.8966 9.0807 15.8729 9.19317 15.828 9.29775C15.7831 9.40232 15.7178 9.4969 15.6359 9.57597L13.2119 12L15.6359 14.424C15.7178 14.503 15.7831 14.5976 15.828 14.7022C15.8729 14.8068 15.8966 14.9192 15.8975 15.0331C15.8985 15.1469 15.8768 15.2597 15.8337 15.3651C15.7907 15.4704 15.727 15.5661 15.6465 15.6466C15.566 15.7271 15.4703 15.7907 15.365 15.8338C15.2597 15.8769 15.1468 15.8986 15.033 15.8976C14.9192 15.8966 14.8067 15.873 14.7021 15.8281C14.5976 15.7831 14.503 15.7178 14.4239 15.636L11.9999 13.212L9.5759 15.636C9.41424 15.7921 9.19773 15.8785 8.97299 15.8765C8.74825 15.8746 8.53326 15.7845 8.37434 15.6255C8.21542 15.4666 8.12528 15.2516 8.12332 15.0269C8.12137 14.8021 8.20777 14.5856 8.3639 14.424L10.7879 12Z"
      />
      <Path
        fill="currentColor"
        d="M12 22.2857C13.3507 22.2857 14.6883 22.0197 15.9362 21.5028C17.1841 20.9859 18.318 20.2282 19.2731 19.2731C20.2282 18.318 20.9859 17.1841 21.5028 15.9362C22.0197 14.6883 22.2857 13.3507 22.2857 12C22.2857 10.6493 22.0197 9.31175 21.5028 8.06383C20.9859 6.81591 20.2282 5.68202 19.2731 4.7269C18.318 3.77178 17.1841 3.01414 15.9362 2.49724C14.6883 1.98033 13.3507 1.71429 12 1.71429C9.27206 1.71429 6.65585 2.79796 4.7269 4.7269C2.79796 6.65585 1.71429 9.27206 1.71429 12C1.71429 14.7279 2.79796 17.3442 4.7269 19.2731C6.65585 21.202 9.27206 22.2857 12 22.2857ZM12 24C8.8174 24 5.76515 22.7357 3.51472 20.4853C1.26428 18.2348 0 15.1826 0 12C0 8.8174 1.26428 5.76515 3.51472 3.51472C5.76515 1.26428 8.8174 0 12 0C15.1826 0 18.2348 1.26428 20.4853 3.51472C22.7357 5.76515 24 8.8174 24 12C24 15.1826 22.7357 18.2348 20.4853 20.4853C18.2348 22.7357 15.1826 24 12 24Z"
      />
    </Svg>
  )
}
const IconClose = memo(themed(Close))
export { IconClose }
