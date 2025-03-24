import type { ColorTokens } from '@my/ui/types'
import { type IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'

const Game = (props) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      fill="none"
      viewBox="0 0 24 24"
      color={color as ColorTokens | undefined}
      width={size ?? 24}
      height={size ?? 24}
      {...rest}
    >
      {/* Dice 1 */}
      <Path
        d="M4 5C4 3.34315 5.34315 2 7 2H9C10.6569 2 12 3.34315 12 5V7C12 8.65685 10.6569 10 9 10H7C5.34315 10 4 8.65685 4 7V5Z"
        fill="currentColor"
        fillOpacity="0.8"
      />
      {/* Center dot for dice 1 */}
      <Path
        d="M8 6C8.55228 6 9 5.55228 9 5C9 4.44772 8.55228 4 8 4C7.44772 4 7 4.44772 7 5C7 5.55228 7.44772 6 8 6Z"
        fill="currentColor"
      />

      {/* Dice 2 */}
      <Path
        d="M14 5C14 3.34315 15.3431 2 17 2H19C20.6569 2 22 3.34315 22 5V7C22 8.65685 20.6569 10 19 10H17C15.3431 10 14 8.65685 14 7V5Z"
        fill="currentColor"
        fillOpacity="0.8"
      />
      {/* Dots for dice 2 */}
      <Path
        d="M16 6C16.5523 6 17 5.55228 17 5C17 4.44772 16.5523 4 16 4C15.4477 4 15 4.44772 15 5C15 5.55228 15.4477 6 16 6Z"
        fill="currentColor"
      />
      <Path
        d="M20 6C20.5523 6 21 5.55228 21 5C21 4.44772 20.5523 4 20 4C19.4477 4 19 4.44772 19 5C19 5.55228 19.4477 6 20 6Z"
        fill="currentColor"
      />

      {/* Dice 3 */}
      <Path
        d="M4 15C4 13.3431 5.34315 12 7 12H9C10.6569 12 12 13.3431 12 15V17C12 18.6569 10.6569 20 9 20H7C5.34315 20 4 18.6569 4 17V15Z"
        fill="currentColor"
        fillOpacity="0.8"
      />
      {/* Dots for dice 3 */}
      <Path
        d="M6 14C6.55228 14 7 13.5523 7 13C7 12.4477 6.55228 12 6 12C5.44772 12 5 12.4477 5 13C5 13.5523 5.44772 14 6 14Z"
        fill="currentColor"
      />
      <Path
        d="M8 16C8.55228 16 9 15.5523 9 15C9 14.4477 8.55228 14 8 14C7.44772 14 7 14.4477 7 15C7 15.5523 7.44772 16 8 16Z"
        fill="currentColor"
      />
      <Path
        d="M10 18C10.5523 18 11 17.5523 11 17C11 16.4477 10.5523 16 10 16C9.44772 16 9 16.4477 9 17C9 17.5523 9.44772 18 10 18Z"
        fill="currentColor"
      />

      {/* Dice 4 */}
      <Path
        d="M14 15C14 13.3431 15.3431 12 17 12H19C20.6569 12 22 13.3431 22 15V17C22 18.6569 20.6569 20 19 20H17C15.3431 20 14 18.6569 14 17V15Z"
        fill="currentColor"
        fillOpacity="0.8"
      />
      {/* Dots for dice 4 */}
      <Path
        d="M16 14C16.5523 14 17 13.5523 17 13C17 12.4477 16.5523 12 16 12C15.4477 12 15 12.4477 15 13C15 13.5523 15.4477 14 16 14Z"
        fill="currentColor"
      />
      <Path
        d="M20 14C20.5523 14 21 13.5523 21 13C21 12.4477 20.5523 12 20 12C19.4477 12 19 12.4477 19 13C19 13.5523 19.4477 14 20 14Z"
        fill="currentColor"
      />
      <Path
        d="M16 18C16.5523 18 17 17.5523 17 17C17 16.4477 16.5523 16 16 16C15.4477 16 15 16.4477 15 17C15 17.5523 15.4477 18 16 18Z"
        fill="currentColor"
      />
      <Path
        d="M20 18C20.5523 18 21 17.5523 21 17C21 16.4477 20.5523 16 20 16C19.4477 16 19 16.4477 19 17C19 17.5523 19.4477 18 20 18Z"
        fill="currentColor"
      />
    </Svg>
  )
}
const IconGame = memo<IconProps>(themed(Game))
export { IconGame }
