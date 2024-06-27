import { type IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import Svg, { Mask, Path, G } from 'react-native-svg'

const BadgeCheck = (props) => {
  const { size, ...rest } = props
  return (
    <Svg width={size ?? 20} height={size ?? 20} fill="none" {...rest}>
      <Mask width={size ?? 20} height={size ?? 20} x={0} y={0} maskUnits="userSpaceOnUse">
        <Path fill="#D9D9D9" d="M0 0h20v20H0z" />
      </Mask>
      <G mask="url(#a)">
        <Path
          fill="currentColor"
          d="m7.23 18.5-1.563-2.583-2.938-.667.271-3L1 10l2-2.25-.27-3 2.937-.667L7.229 1.5 10 2.688 12.77 1.5l1.563 2.583 2.938.667-.271 3L19 10l-2 2.25.27 3-2.937.667-1.562 2.583L10 17.312 7.23 18.5Zm.603-1.896L10 15.688l2.167.916 1.208-2.02 2.292-.521-.209-2.313L17 10l-1.542-1.75.209-2.313-2.292-.52-1.208-2.021L10 4.313l-2.167-.917-1.208 2.02-2.292.5.209 2.334L3 10l1.563 1.75-.23 2.333 2.292.521 1.208 2ZM8.937 13l4.959-4.938L12.833 7l-3.896 3.875-1.77-1.75-1.063 1.063L8.937 13Z"
        />
      </G>
    </Svg>
  )
}
const IconBadgeCheck = memo<IconProps>(themed(BadgeCheck))
export { IconBadgeCheck }
