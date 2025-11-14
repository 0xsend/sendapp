import { themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import Svg, { Path } from 'react-native-svg'

const BadgeCheckSolid = (props) => {
  const { size = 22, color = 'currentColor', checkColor = '#082B1B', ...rest } = props

  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none" color={color} {...rest}>
      <Path
        d="M7.6 21.5L5.7 18.3L2.1 17.5L2.45 13.8L0 11L2.45 8.2L2.1 4.5L5.7 3.7L7.6 0.5L11 1.95L14.4 0.5L16.3 3.7L19.9 4.5L19.55 8.2L22 11L19.55 13.8L19.9 17.5L16.3 18.3L14.4 21.5L11 20.05L7.6 21.5Z"
        fill={color}
        strokeLinejoin="round"
      />
      <Path
        d="M9.95 14.55L15.6 8.9L14.2 7.45L9.95 11.7L7.8 9.6L6.4 11L9.95 14.55Z"
        fill={checkColor}
      />
    </Svg>
  )
}

const IconBadgeCheckSolid2 = memo(themed(BadgeCheckSolid))
export { IconBadgeCheckSolid2 }
