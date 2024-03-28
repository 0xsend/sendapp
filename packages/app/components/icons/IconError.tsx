import type { ColorTokens } from '@my/ui/types'
import { type IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'

const Err = (props: IconProps) => {
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
        d="M12 3.25L2.375 19.875H21.625M12 6.75L18.5888 18.125H5.41125M11.125 10.25V13.75H12.875V10.25M11.125 15.5V17.25H12.875V15.5"
        fill="currentColor"
      />
    </Svg>
  )
}
const IconError = memo(themed(Err))
export { IconError }
