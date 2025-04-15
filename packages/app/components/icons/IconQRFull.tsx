import { type IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'
import type { ColorTokens } from '@my/ui'

const QRFull = (props) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      width={size ?? 28}
      height={size ?? 28}
      color={color as ColorTokens | undefined}
      viewBox="0 0 30 30"
      fill="none"
      {...rest}
    >
      <Path
        fill="currentColor"
        d="M0 13.611V0h13.611v13.611H0Zm2.778-2.778h8.055V2.778H2.778v8.055ZM0 30V16.389h13.611V30H0Zm2.778-2.778h8.055v-8.055H2.778v8.055Zm13.61-13.61V0H30v13.611H16.389Zm2.779-2.779h8.055V2.778h-8.055v8.055ZM26.61 30v-3.389H30V30h-3.389ZM16.39 19.805V16.39h3.389v3.416h-3.39Zm3.389 3.39v-3.39h3.417v3.39h-3.417Zm-3.39 3.416v-3.416h3.39v3.416h-3.39ZM19.779 30v-3.389h3.417V30h-3.417Zm3.417-3.389v-3.416h3.416v3.416h-3.416Zm0-6.806V16.39h3.416v3.416h-3.416Zm3.416 3.39v-3.39H30v3.39h-3.389Z"
      />
    </Svg>
  )
}
const IconQRFull = memo<IconProps>(themed(QRFull))
export { IconQRFull }
