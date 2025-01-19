import type { ColorTokens } from '@my/ui'
import { type IconProps, themed } from '@tamagui/helpers-icon'
import * as React from 'react'
import Svg, { Path } from 'react-native-svg'
function Upgrade(props) {
  const { size, color } = props

  return (
    <Svg
      width={size ?? 40}
      height={size ?? 40}
      viewBox="0 0 40 40"
      color={color as ColorTokens | undefined}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <Path
        d="M33.714 28l-1.6 1.6-2.971-2.972v9.371h-2.286v-9.371l-2.971 2.971-1.6-1.6L28 22.285 33.714 28z"
        fill="currentColor"
      />
      <Path
        d="M19.314 36L7.428 28.914c-.685-.457-1.142-1.143-1.142-1.943V13.03c0-.8.457-1.6 1.143-1.943l11.428-6.743A1.93 1.93 0 0120 4c.457 0 .8.114 1.143.343l11.428 6.743c.686.457 1.143 1.143 1.143 1.943V20H31.43v-6.971l-11.43-6.743-11.428 6.743V26.97l12 7.086L19.314 36z"
        fill="currentColor"
      />
    </Svg>
  )
}

const IconUpgrade = React.memo<IconProps>(themed(Upgrade))
export { IconUpgrade }

export default IconUpgrade
