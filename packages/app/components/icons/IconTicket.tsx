import { memo } from 'react'
import Svg, { Path } from 'react-native-svg'
import type { ColorTokens } from '@my/ui'
import { type IconProps, themed } from '@tamagui/helpers-icon'

const Ticket = (props) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      color={color as ColorTokens | undefined}
      width={size ?? 24}
      height={size ?? 24}
      {...rest}
    >
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5Z"
      />
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 5a2 2 0 0 0-2-2h-3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3a2 2 0 0 0 2-2V5Z"
      />
    </Svg>
  )
}

const IconTicket = memo<IconProps>(themed(Ticket))

export { IconTicket }
