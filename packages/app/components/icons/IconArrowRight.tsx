import { ColorTokens } from '@my/ui/types'
import { IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'

const ArrowRight = (props: IconProps) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      viewBox="0 0 24 16"
      color={color as ColorTokens | undefined}
      width={size ?? 24}
      height={size ?? 16}
      fill={'none'}
      transform={'scale(-1,1)'}
      {...rest}
    >
      <Path
        d="M25 9C25.5523 9 26 8.55228 26 8C26 7.44772 25.5523 7 25 7V9ZM0.292893 7.29289C-0.0976311 7.68342 -0.0976311 8.31658 0.292893 8.70711L6.65685 15.0711C7.04738 15.4616 7.68054 15.4616 8.07107 15.0711C8.46159 14.6805 8.46159 14.0474 8.07107 13.6569L2.41421 8L8.07107 2.34315C8.46159 1.95262 8.46159 1.31946 8.07107 0.928932C7.68054 0.538408 7.04738 0.538408 6.65685 0.928932L0.292893 7.29289ZM25 7H1V9H25V7Z4"
        fill="currentColor"
      />
    </Svg>
  )
}
const IconArrowRight = memo(themed(ArrowRight))
export { IconArrowRight }
