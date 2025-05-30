import type { ColorTokens } from '@my/ui'
import { type IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'

const Star = (props) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      color={color as ColorTokens | undefined}
      width={size}
      height={size}
      viewBox="0 0 20 20"
      {...rest}
    >
      <Path
        fill="currentColor"
        d="M17.4608 8.24405C17.362 7.94032 17.0926 7.72528 16.7751 7.69655L12.4451 7.30344L10.7338 3.29704C10.6075 3.00269 10.32 2.81271 10 2.81271C9.68003 2.81271 9.39243 3.00269 9.26689 3.29704L7.55563 7.30344L3.22489 7.69655C2.90742 7.72585 2.6386 7.94089 2.53926 8.24405C2.4405 8.54778 2.53171 8.88092 2.77181 9.0915L6.04499 11.9616L5.07989 16.2122C5.00928 16.5248 5.13059 16.848 5.38992 17.0354C5.52931 17.1367 5.69307 17.1873 5.85741 17.1873C5.99864 17.1873 6.13997 17.1497 6.2662 17.0742L10 14.8417L13.7331 17.0742C14.007 17.2379 14.3513 17.2229 14.6101 17.0354C14.8694 16.848 14.9907 16.5248 14.9201 16.2122L13.955 11.9616L17.2282 9.0915C17.4682 8.88092 17.5595 8.54847 17.4608 8.24405Z"
      />
    </Svg>
  )
}
const IconStar = memo<IconProps>(themed(Star))
export { IconStar }
