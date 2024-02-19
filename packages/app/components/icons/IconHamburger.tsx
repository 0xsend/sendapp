{
  /* <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" stroke-linejoin="round" class="lucide lucide-menu">
<line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" />
</svg> */
}

import { ColorTokens } from '@my/ui/types'
import { IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Line, Svg } from 'react-native-svg'

const Hamburger = (props: IconProps) => {
  const { size, strokeWidth, color, ...rest } = props
  return (
    <Svg
      viewBox="0 0 24 24"
      color={color as ColorTokens | undefined}
      width={size ?? 24}
      height={size ?? 24}
      fill={'none'}
      strokeWidth={strokeWidth ?? 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <Line x1="4" x2="20" y1="12" y2="12" stroke="currentColor" />
      <Line x1="4" x2="20" y1="6" y2="6" stroke="currentColor" />
      <Line x1="4" x2="20" y1="18" y2="18" stroke="currentColor" />
    </Svg>
  )
}
const IconHamburger = memo(themed(Hamburger))
export { IconHamburger }
