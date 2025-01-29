import { memo } from 'react'
import { type IconProps, themed } from '@tamagui/helpers-icon'
import { Path, Svg } from 'react-native-svg'
import type { ColorTokens } from '@my/ui'

const SendSingleLetter = (props) => {
  const { size, color, ...rest } = props

  return (
    <Svg
      color={color as ColorTokens | undefined}
      width={size}
      height={size}
      viewBox="0 0 22 24"
      {...rest}
    >
      <Path fill="currentColor" d="M0.666016 24L7.51407 0H10.7066L3.85852 24H0.666016Z" />
      <Path
        fill="currentColor"
        d="M15.7106 21.3888C14.4912 21.3888 13.4313 21.1941 12.531 20.8046C11.6306 20.4151 10.9206 19.8719 10.4035 19.1749C9.88383 18.4779 9.58027 17.6758 9.49023 16.7687H12.7651C12.8551 17.1505 13.0197 17.499 13.2564 17.8142C13.4931 18.132 13.8146 18.3805 14.2263 18.5624C14.6353 18.7444 15.1215 18.8341 15.6849 18.8341C16.2483 18.8341 16.6753 18.7572 17.0226 18.6034C17.3673 18.4497 17.622 18.2447 17.7866 17.991C17.9513 17.7373 18.031 17.4657 18.031 17.1762C18.031 16.7405 17.9127 16.4074 17.676 16.1717C17.4393 15.9359 17.0972 15.7514 16.6521 15.6156C16.2071 15.4798 15.6746 15.3491 15.0546 15.221C14.3986 15.0954 13.7683 14.9366 13.1587 14.7444C12.549 14.5548 12.0036 14.3139 11.5225 14.0243C11.0415 13.7348 10.6582 13.3632 10.3778 12.9097C10.0948 12.4561 9.95586 11.9052 9.95586 11.2517C9.95586 10.4548 10.1694 9.7399 10.5964 9.10441C11.0235 8.47148 11.6434 7.96667 12.4512 7.59512C13.2616 7.22356 14.2288 7.03906 15.3582 7.03906C16.9583 7.03906 18.2368 7.40549 19.1912 8.13836C20.1456 8.87122 20.7064 9.90133 20.8685 11.2236H17.7583C17.6683 10.7162 17.4136 10.3216 16.9943 10.0423C16.575 9.76296 16.0219 9.62202 15.3299 9.62202C14.6379 9.62202 14.0796 9.75271 13.7066 10.0166C13.3336 10.2806 13.1484 10.6291 13.1484 11.0621C13.1484 11.3517 13.2616 11.6054 13.4905 11.8232C13.7169 12.041 14.0487 12.228 14.4861 12.3792C14.9234 12.533 15.4585 12.6816 16.0965 12.8277C17.1152 13.0275 18.0156 13.2633 18.7976 13.5349C19.5797 13.8065 20.1971 14.2063 20.6524 14.7316C21.1078 15.2569 21.3341 16 21.3341 16.9609C21.3521 17.8296 21.1283 18.6009 20.6653 19.2722C20.2022 19.9436 19.5514 20.4638 18.7153 20.8353C17.8792 21.2069 16.8785 21.3914 15.7132 21.3914L15.7106 21.3888Z"
      />
    </Svg>
  )
}

const IconSendSingleLetter = memo<IconProps>(themed(SendSingleLetter))
export { IconSendSingleLetter }
