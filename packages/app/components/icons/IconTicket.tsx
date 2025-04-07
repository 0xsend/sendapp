import { memo } from 'react'
import Svg, { Path } from 'react-native-svg'
import type { ColorTokens } from '@my/ui'
import { type IconProps, themed } from '@tamagui/helpers-icon'

const Ticket = (props) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      width={size ?? 24} // Default size to 24 like the original ticket icon
      height={size ?? 24} // Default size to 24 like the original ticket icon
      color={color as ColorTokens | undefined} // Keep color prop for theming
      viewBox="0 0 24 24" // Use the viewBox from the ticket SVG
      fill="none" // Ticket icon uses stroke, not fill
      stroke="currentColor" // Set stroke to currentColor, will be overridden by the color prop if provided
      strokeWidth="2" // Set default stroke width from ticket SVG
      {...rest}
    >
      {/* Use the Path data from the ticket SVG */}
      <Path
        d="M14 6H6C5.06812 6 4.60192 6 4.23438 6.15224C3.74432 6.35523 3.35523 6.74481 3.15224 7.23486C3 7.60241 3 8.06835 3 9.00023C4.65685 9.00023 6 10.3429 6 11.9998C6 13.6566 4.65685 15 3 15C3 15.9319 3 16.3978 3.15224 16.7654C3.35523 17.2554 3.74432 17.6447 4.23438 17.8477C4.60192 17.9999 5.06812 18 6 18H14M14 6H18C18.9319 6 19.3978 6 19.7654 6.15224C20.2554 6.35523 20.6447 6.74481 20.8477 7.23486C20.9999 7.6024 20.9999 8.06835 20.9999 9.00023C19.343 9.00023 18 10.3431 18 12C18 13.6569 19.343 15 20.9999 15C20.9999 15.9319 20.9999 16.3978 20.8477 16.7654C20.6447 17.2554 20.2554 17.6447 19.7654 17.8477C19.3978 17.9999 18.9319 18 18 18H14M14 6V18"
        strokeLinecap="round" // Keep styling from ticket SVG
        strokeLinejoin="round" // Keep styling from ticket SVG
        // The 'stroke' prop will be inherited from the parent Svg component
      />
      {/* Removed Defs and ClipPath as they are not needed for the ticket icon */}
    </Svg>
  )
}

const IconTicket = memo<IconProps>(themed(Ticket))

export { IconTicket }
