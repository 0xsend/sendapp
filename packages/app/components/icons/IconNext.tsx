import { IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'

const Next = (props: IconProps) => {
  const { size, color, ...rest } = props
  return (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <Path
        d="M7.79999 19.2L16.8 12L7.79999 4.79995"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  )
}
const IconNext = memo(themed(Next))
export { IconNext }
