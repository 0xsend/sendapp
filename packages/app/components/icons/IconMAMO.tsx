import type { ColorTokens } from '@my/ui'
import { type IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg, Text } from 'react-native-svg'

const Mamo = (props) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      viewBox="0 0 100 100"
      color={color as ColorTokens | undefined}
      width={size ?? 32}
      height={size ?? 32}
      {...rest}
    >
      <Path
        d="M50 100C77.614 100 100 77.614 100 50C100 22.386 77.614 0 50 0C22.386 0 0 22.386 0 50C0 77.614 22.386 100 50 100Z"
        fill="#8B5CF6"
      />
      <Text
        x="50"
        y="57"
        textAnchor="middle"
        fontSize="16"
        fontWeight="bold"
        fill="#FFFFFF"
      >
        MAMO
      </Text>
    </Svg>
  )
}
const IconMAMO = memo<IconProps>(themed(Mamo))
export { IconMAMO }