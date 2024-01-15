import { ColorTokens } from '@my/ui/types'
import { IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Circle, Defs, Path, Stop, Svg } from 'react-native-svg'

const Deposit = (props: IconProps) => {
  const { size, color, ...rest } = props
  return (
    <Svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <Circle
        cx="19.9999"
        cy="20"
        r="19"
        stroke="#C3AB8E"
        stroke-width="2"
        stroke-linecap="round"
      />
      <Path
        d="M19.9997 12.5L19.9997 27.5"
        stroke="#C3AB8E"
        stroke-width="2"
        stroke-linecap="round"
      />
      <Path d="M27.4997 20L12.4997 20" stroke="#C3AB8E" stroke-width="2" stroke-linecap="round" />
    </Svg>
  )
}
const IconDeposit = memo(themed(Deposit))
export { IconDeposit }
