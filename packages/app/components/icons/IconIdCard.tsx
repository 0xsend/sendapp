import type { ColorTokens } from '@my/ui/types'
import { type IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'

const IdCard = (props) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      color={color as ColorTokens | undefined}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      {...rest}
    >
      <Path
        fill="currentColor"
        d="M14 13H19V11H14V13ZM14 10H19V8H14V10ZM5 16H13V15.45C13 14.7 12.6333 14.1042 11.9 13.6625C11.1667 13.2208 10.2 13 9 13C7.8 13 6.83333 13.2208 6.1 13.6625C5.36667 14.1042 5 14.7 5 15.45V16ZM9 12C9.55 12 10.0208 11.8042 10.4125 11.4125C10.8042 11.0208 11 10.55 11 10C11 9.45 10.8042 8.97917 10.4125 8.5875C10.0208 8.19583 9.55 8 9 8C8.45 8 7.97917 8.19583 7.5875 8.5875C7.19583 8.97917 7 9.45 7 10C7 10.55 7.19583 11.0208 7.5875 11.4125C7.97917 11.8042 8.45 12 9 12ZM2 20V4H22V20H2ZM4 18H20V6H4V18Z"
      />
    </Svg>
  )
}
const IconIdCard = memo<IconProps>(themed(IdCard))
export { IconIdCard }
