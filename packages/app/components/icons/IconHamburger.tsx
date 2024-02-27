{
  /* <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" stroke-linejoin="round" class="lucide lucide-menu">
<line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" />
</svg> */
}

import { ColorTokens } from '@my/ui/types'
import { IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Svg, Path } from 'react-native-svg'

const Hamburger = (props: IconProps) => {
  const { size, strokeWidth, color, ...rest } = props
  return (
    <Svg
      viewBox="0 0 32 33"
      color={color as ColorTokens | undefined}
      width={size ?? 32}
      height={size ?? 33}
      fill={'none'}
      strokeWidth={strokeWidth ?? 2}
      {...rest}
    >
      <Path
        d="M28 7.16663H4V9.64282H28V7.16663ZM23.6552 15.0238H4V17.5H23.6552V15.0238ZM17.8103 22.8809H4V25.3571H17.8103V22.8809Z"
        fill="currentColor"
      />
    </Svg>
  )
}
const IconHamburger = memo(themed(Hamburger))
export { IconHamburger }
