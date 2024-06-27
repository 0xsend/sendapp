import type { ColorTokens } from '@my/ui'
import { themed, type IconProps } from '@tamagui/helpers-icon'
import { memo } from 'react'
import Svg, { Path } from 'react-native-svg'

function ChainBase(props) {
  const { size = 32, color, ...rest } = props
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 111 111"
      color={color as ColorTokens | undefined}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <Path
        d="M54.921 110.034c30.438 0 55.113-24.632 55.113-55.017S85.359 0 54.921 0C26.043 0 2.353 22.171 0 50.392h72.847v9.25H0c2.353 28.22 26.043 50.392 54.921 50.392z"
        fill="currentColor"
      />
    </Svg>
  )
}

const IconChainBase = memo<IconProps>(themed(ChainBase))
export { IconChainBase }
