import { IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Circle, Path, Svg } from 'react-native-svg'
import { ColorTokens } from '@my/ui/types'

const Deposit = (props: IconProps) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      width={size ?? 40}
      height={size ?? 40}
      color={color as ColorTokens | undefined}
      viewBox="0 0 40 40"
      fill="none"
      {...rest}
    >
      <Circle
        cx="19.9999"
        cy="20"
        r="19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M19.9997 12.5L19.9997 27.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M27.4997 20L12.4997 20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  )
}
const IconDeposit = memo(themed(Deposit))
export { IconDeposit }
