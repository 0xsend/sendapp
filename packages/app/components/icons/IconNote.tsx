import type { ColorTokens } from '@my/ui'
import { type IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'

const Note = (props) => {
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
        d="M18.75 10.4089V4.125C18.75 3.50366 18.2463 3 17.625 3M17.625 3C17.0037 3 16.5 3.50366 16.5 4.125C16.5 4.74626 17.0036 5.24989 17.6249 5.24985H17.625L4.12489 5.25C3.50363 5.25 3 4.74637 3 4.12511V4.125C3 3.50366 3.50366 3 4.125 3H17.625Z"
        stroke="currentColor"
        strokeMiterlimit="10"
      />
      <Path d="M5.25 5.25V21H18.75V13.591" stroke="currentColor" strokeMiterlimit="10" />
      <Path
        d="M13.591 18.7501L20.6705 11.6706C21.1099 11.2312 21.1099 10.5189 20.6705 10.0795C20.2312 9.64016 19.5188 9.64016 19.0795 10.0795L12 17.159V18.75L13.591 18.7501Z"
        stroke="currentColor"
        strokeMiterlimit="10"
      />
      <Path
        d="M12.9729 16.1855L14.5639 17.7765"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeMiterlimit="10"
      />
      <Path
        d="M18.2839 10.875L19.875 12.466"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeMiterlimit="10"
      />
      <Path
        d="M12.5603 9.75H6.93994"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeMiterlimit="10"
      />
      <Path d="M17.1591 12H6.93994" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" />
      <Path
        d="M14.9091 14.25H6.93994"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeMiterlimit="10"
      />
      <Path
        d="M12.7955 16.5H6.93994"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeMiterlimit="10"
      />
    </Svg>
  )
}
const IconNote = memo<IconProps>(themed(Note))
export { IconNote }
