import type { ColorTokens } from '@my/ui'
import { type IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'

const Clock = (props) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      color={color as ColorTokens | undefined}
      width={size}
      height={size}
      viewBox="0 0 25 24"
      {...rest}
    >
      <Path
        fill={'currentColor'}
        d="M13.4087 11.6236V6.54346H11.5898V12.3766L15.4941 16.2809L16.7801 14.9949L13.4087 11.6236Z"
      />
      <Path
        fill={'currentColor'}
        d="M12.5 22.0039C18.0249 22.0039 22.5039 17.5249 22.5039 12C22.5039 6.47512 18.0249 1.99609 12.5 1.99609C6.97512 1.99609 2.49609 6.47512 2.49609 12C2.49609 17.5249 6.97512 22.0039 12.5 22.0039ZM12.5 20.185C11.4251 20.185 10.3608 19.9733 9.36773 19.562C8.37468 19.1506 7.47237 18.5477 6.71232 17.7877C5.95227 17.0276 5.34937 16.1253 4.93803 15.1323C4.5267 14.1392 4.31499 13.0749 4.31499 12C4.31499 10.9251 4.5267 9.86078 4.93803 8.86773C5.34937 7.87468 5.95227 6.97237 6.71232 6.21232C7.47237 5.45227 8.37468 4.84937 9.36773 4.43803C10.3608 4.0267 11.4251 3.81499 12.5 3.81499C14.6708 3.81499 16.7527 4.67733 18.2877 6.21232C19.8227 7.74731 20.685 9.8292 20.685 12C20.685 14.1708 19.8227 16.2527 18.2877 17.7877C16.7527 19.3227 14.6708 20.185 12.5 20.185Z"
        fillRule={'evenodd'}
        clipRule={'evenodd'}
      />
    </Svg>
  )
}
const IconClock = memo<IconProps>(themed(Clock))
export { IconClock }
