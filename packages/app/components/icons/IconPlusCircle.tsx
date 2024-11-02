import type { ColorTokens } from '@my/ui/types'
import { type IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'

const PlusCircle = (props) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      fill="none"
      viewBox="0 0 24 24"
      color={color as ColorTokens | undefined}
      width={size ?? 24}
      height={size ?? 24}
      {...rest}
    >
      <Path
        fill="currentColor"
        d="M11 17h2v-4h4v-2h-4V7h-2v4H7v2h4v4Zm1 5a9.873 9.873 0 0 1-3.9-.775 10.274 10.274 0 0 1-3.175-2.15c-.9-.9-1.617-1.958-2.15-3.175A9.873 9.873 0 0 1 2 12c0-1.383.258-2.683.775-3.9a10.275 10.275 0 0 1 2.15-3.175c.9-.9 1.958-1.608 3.175-2.125A9.607 9.607 0 0 1 12 2c1.383 0 2.683.267 3.9.8a9.927 9.927 0 0 1 3.175 2.125c.9.9 1.608 1.958 2.125 3.175.533 1.217.8 2.517.8 3.9a9.607 9.607 0 0 1-.8 3.9 9.927 9.927 0 0 1-2.125 3.175c-.9.9-1.958 1.617-3.175 2.15A9.873 9.873 0 0 1 12 22Zm0-2c2.233 0 4.125-.775 5.675-2.325C19.225 16.125 20 14.233 20 12c0-2.233-.775-4.125-2.325-5.675C16.125 4.775 14.233 4 12 4c-2.233 0-4.125.775-5.675 2.325C4.775 7.875 4 9.767 4 12c0 2.233.775 4.125 2.325 5.675C7.875 19.225 9.767 20 12 20Z"
      />
    </Svg>
  )
}
const IconPlusCircle = memo<IconProps>(themed(PlusCircle))
export { IconPlusCircle }
