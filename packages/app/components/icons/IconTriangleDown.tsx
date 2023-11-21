import { ColorTokens } from '@my/ui/types'
import { themed, IconProps } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'

const TriangleDown = (props: IconProps) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      viewBox="0 0 12 7"
      color={color as ColorTokens | undefined}
      width={size}
      height={size}
      {...rest}
    >
      <Path
        fill="currentColor"
        d="M0.999725 -3.14792e-05C0.801975 1.0942e-05 0.608677 0.0586824 0.444267 0.168567C0.279857 0.278451 0.151718 0.434615 0.0760475 0.617314C0.000377243 0.800014 -0.0194258 1.00105 0.0191417 1.195C0.0577092 1.38895 0.152915 1.56712 0.292724 1.70697L5.29273 6.70697C5.48025 6.89444 5.73456 6.99976 5.99972 6.99976C6.26489 6.99976 6.5192 6.89444 6.70672 6.70697L11.7067 1.70697C11.8465 1.56712 11.9417 1.38895 11.9803 1.195C12.0189 1.00105 11.9991 0.800015 11.9234 0.617315C11.8477 0.434616 11.7196 0.278452 11.5552 0.168568C11.3908 0.0586833 11.1975 1.18508e-05 10.9997 -3.0605e-05L0.999725 -3.14792e-05Z"
      />
    </Svg>
  )
}
const IconTriangleDown = memo(themed(TriangleDown))
export { IconTriangleDown }
