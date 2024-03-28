import type { ColorTokens } from '@my/ui/types'
import { type IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'

const Plus = (props: IconProps) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      fill="none"
      viewBox="0 0 20 20"
      color={color as ColorTokens | undefined}
      width={size ?? 20}
      height={size ?? 20}
      {...rest}
    >
      <Path
        d="M9.37508 10.6243H4.16675V9.37435H9.37508V4.16602H10.6251V9.37435H15.8334V10.6243H10.6251V15.8327H9.37508V10.6243Z"
        fill="currentColor"
      />
    </Svg>
  )
}
const IconPlus = memo(themed(Plus))
export { IconPlus }
