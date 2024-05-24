import { type IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'
import type { ColorTokens } from '@my/ui/types'

const Security = (props) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      width={size ?? 16}
      height={size ?? 28}
      color={color as ColorTokens | undefined}
      viewBox="0 0 18 20"
      fill="none"
      {...rest}
    >
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.71657 19.5444C8.89824 19.6185 9.10174 19.6185 9.28342 19.5444C14.0105 17.6149 17.1 13.017 17.1 7.9113V4.20161C17.1 3.89849 16.9175 3.62517 16.6376 3.50894L9.28758 0.457302C9.10348 0.380863 8.89651 0.380863 8.7124 0.457302L1.3624 3.50894C1.08246 3.62517 0.899994 3.89849 0.899994 4.20161V7.9113C0.899994 13.017 3.9895 17.6149 8.71657 19.5444ZM8.99999 18.0353C4.9976 16.271 2.39999 12.3046 2.39999 7.9113V4.7023L8.99999 1.96205L15.6 4.7023V7.9113C15.6 12.3046 13.0024 16.271 8.99999 18.0353Z"
        fill="currentColor"
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.64068 12.0303C7.93357 12.3232 8.40844 12.3232 8.70133 12.0303L12.4553 8.27639C12.7482 7.9835 12.7482 7.50863 12.4553 7.21573C12.1624 6.92284 11.6875 6.92284 11.3947 7.21573L8.17101 10.4393L6.60531 8.87364C6.31242 8.58075 5.83754 8.58075 5.54465 8.87364C5.25176 9.16654 5.25176 9.64141 5.54465 9.9343L7.64068 12.0303Z"
        fill="currentColor"
      />
    </Svg>
  )
}
const IconSecurity = memo<IconProps>(themed(Security))
export { IconSecurity }
