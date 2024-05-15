import type { ColorTokens } from '@my/ui/types'
import { type IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'

const Share = (props) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      viewBox="0 0 24 24"
      color={color as ColorTokens | undefined}
      width={size ?? 24}
      height={size ?? 24}
      fill={'none'}
      {...rest}
    >
      <Path
        d="M4.19995 10.8V18.48C4.19995 18.9892 4.40224 19.4776 4.76231 19.8376C5.12238 20.1977 5.61074 20.4 6.11995 20.4H17.64C18.1492 20.4 18.6375 20.1977 18.9976 19.8376C19.3577 19.4776 19.56 18.9892 19.56 18.48V10.8M15.72 7.43998L11.88 3.59998M11.88 3.59998L8.03995 7.43998M11.88 3.59998V13.68"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}
const IconShare = memo<IconProps>(themed(Share))
export { IconShare }
