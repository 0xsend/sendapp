import type { ColorTokens } from '@my/ui'
import { type IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'

const Facebook = (props) => {
  const { size, color, ...rest } = props

  return (
    <Svg
      color={color as ColorTokens | undefined}
      width={size ?? 24}
      height={size ?? 24}
      viewBox="0 0 1024 1024"
      {...rest}
    >
      <Path
        d="M941.831 0H82.169C36.742 0 0 36.742 0 82.169v941.662C0 1087.258 36.742 1124 82.169 1124h493.198V686.342H423.362v-165.62h151.992V408.075c0-150.731 92.019-233.116 226.368-233.116 64.514 0 119.977 4.8 135.98 6.963v157.71h-93.245c-73.095 0-87.195 34.747-87.195 85.735v112.433h175.738l-22.912 165.62h-152.826V1124h299.614c45.427 0 82.169-36.742 82.169-82.169V82.169C1024 36.742 987.257 0 941.831 0z"
        fill="currentColor"
      />
    </Svg>
  )
}

const IconFacebook = memo<IconProps>(themed(Facebook))

export { IconFacebook }
