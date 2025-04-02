import type { ColorTokens } from '@my/ui'
import { Path, Svg } from 'react-native-svg'
import { memo } from 'react'
import { type IconProps, themed } from '@tamagui/helpers-icon'

const Stacks = (props) => {
  const { size, color, ...rest } = props

  return (
    <Svg
      color={color as ColorTokens | undefined}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      {...rest}
    >
      <Path
        fill="currentColor"
        d="M12 14L1 8L12 2L23 8L12 14ZM12 18L1.575 12.325L3.675 11.175L12 15.725L20.325 11.175L22.425 12.325L12 18ZM12 22L1.575 16.325L3.675 15.175L12 19.725L20.325 15.175L22.425 16.325L12 22ZM12 11.725L18.825 8L12 4.275L5.175 8L12 11.725Z"
      />
    </Svg>
  )
}

const IconStacks = memo<IconProps>(themed(Stacks))
export { IconStacks }
