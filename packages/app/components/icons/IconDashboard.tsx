import type { ColorTokens } from '@my/ui/types'
import { type IconProps, themed } from '@tamagui/helpers-icon'
import * as React from 'react'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'

const Dashboard = (props) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      color={color as ColorTokens | undefined}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      {...rest}
    >
      <Path
        d="M13.5 12H5.5C4.673 12 4 11.327 4 10.5V5.5C4 4.673 4.673 4 5.5 4H13.5C14.327 4 15 4.673 15 5.5V10.5C15 11.327 14.327 12 13.5 12ZM5.5 5C5.225 5 5 5.224 5 5.5V10.5C5 10.776 5.225 11 5.5 11H13.5C13.775 11 14 10.776 14 10.5V5.5C14 5.224 13.775 5 13.5 5H5.5Z"
        fill="currentColor"
      />
      <Path
        d="M13.5 28H5.5C4.673 28 4 27.327 4 26.5V15.5C4 14.673 4.673 14 5.5 14H13.5C14.327 14 15 14.673 15 15.5V26.5C15 27.327 14.327 28 13.5 28ZM5.5 15C5.225 15 5 15.224 5 15.5V26.5C5 26.776 5.225 27 5.5 27H13.5C13.775 27 14 26.776 14 26.5V15.5C14 15.224 13.775 15 13.5 15H5.5Z"
        fill="currentColor"
      />
      <Path
        d="M26.5 28H18.5C17.673 28 17 27.327 17 26.5V21.5C17 20.673 17.673 20 18.5 20H26.5C27.327 20 28 20.673 28 21.5V26.5C28 27.327 27.327 28 26.5 28ZM18.5 21C18.225 21 18 21.224 18 21.5V26.5C18 26.776 18.225 27 18.5 27H26.5C26.775 27 27 26.776 27 26.5V21.5C27 21.224 26.775 21 26.5 21H18.5Z"
        fill="currentColor"
      />
      <Path
        d="M26.5 18H18.5C17.673 18 17 17.327 17 16.5V5.5C17 4.673 17.673 4 18.5 4H26.5C27.327 4 28 4.673 28 5.5V16.5C28 17.327 27.327 18 26.5 18ZM18.5 5C18.225 5 18 5.224 18 5.5V16.5C18 16.776 18.225 17 18.5 17H26.5C26.775 17 27 16.776 27 16.5V5.5C27 5.224 26.775 5 26.5 5H18.5Z"
        fill="currentColor"
      />
    </Svg>
  )
}
const IconDashboard = memo<IconProps>(themed(Dashboard))
export { IconDashboard }
