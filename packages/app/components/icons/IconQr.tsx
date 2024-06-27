import { type IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'
import type { ColorTokens } from '@my/ui/types'

const QrLogo = (props) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      width={size ?? 28}
      height={size ?? 28}
      color={color as ColorTokens | undefined}
      viewBox="0 0 28 28"
      fill="none"
      {...rest}
    >
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2.33333 3.50016C2.33333 2.85584 2.85567 2.3335 3.49999 2.3335H8.74999V4.66683H4.66666V8.75016H2.33333V3.50016ZM23.3333 4.66683H19.25V2.3335H24.5C25.1443 2.3335 25.6667 2.85584 25.6667 3.50016V8.75016H23.3333V4.66683ZM4.66666 23.3335V19.2502H2.33333V24.5002C2.33333 25.1445 2.85567 25.6668 3.49999 25.6668H8.74999V23.3335H4.66666ZM23.3333 23.3335V19.2502H25.6667V24.5002C25.6667 25.1445 25.1443 25.6668 24.5 25.6668H19.25V23.3335H23.3333Z"
        fill="currentColor"
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M19.8333 15.1668H8.16666V12.8335H19.8333V15.1668Z"
        fill="currentColor"
      />
    </Svg>
  )
}
const IconQr = memo<IconProps>(themed(QrLogo))
export { IconQr }
