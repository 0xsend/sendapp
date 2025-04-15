import { type IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'
import type { ColorTokens } from '@my/ui'

const Personal = (props) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      width={size ?? 18}
      height={size ?? 20}
      color={color as ColorTokens | undefined}
      viewBox="0 0 18 20"
      fill="none"
      {...rest}
    >
      <Path
        d="M11.8945 9.30271C13.1231 8.40672 13.9231 6.95667 13.9231 5.3231C13.9231 2.60851 11.7146 0.400024 9.00002 0.400024C6.28543 0.400024 4.07694 2.60851 4.07694 5.3231C4.07694 6.95667 4.87693 8.40672 6.1055 9.30271C3.0515 10.4714 0.876953 13.4324 0.876953 16.8923C0.876953 18.3854 2.09162 19.6 3.58464 19.6H14.4154C15.9084 19.6 17.1231 18.3854 17.1231 16.8923C17.1231 13.4324 14.9485 10.4714 11.8945 9.30271ZM5.55388 5.3231C5.55388 3.4229 7.09982 1.87696 9.00002 1.87696C10.9002 1.87696 12.4462 3.4229 12.4462 5.3231C12.4462 7.2233 10.9002 8.76927 9.00002 8.76927C7.09982 8.76927 5.55388 7.2233 5.55388 5.3231ZM14.4154 18.1231H3.58464C2.906 18.1231 2.35389 17.571 2.35389 16.8923C2.35389 13.2276 5.33529 10.2461 9.00005 10.2461C12.6648 10.2461 15.6462 13.2275 15.6462 16.8923C15.6462 17.571 15.0941 18.1231 14.4154 18.1231Z"
        fill="currentColor"
      />
    </Svg>
  )
}
const IconPersonal = memo<IconProps>(themed(Personal))
export { IconPersonal }
