import type { ColorTokens } from '@my/ui'
import { type IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'

const Apple = (props) => {
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
        d="M18.1726 22.1173C16.975 23.2783 15.6674 23.095 14.4086 22.5451C13.0766 21.9829 11.8545 21.9585 10.4491 22.5451C8.68937 23.3027 7.7606 23.0828 6.70962 22.1173C0.745927 15.9703 1.62582 6.60929 8.39607 6.26711C10.0459 6.35266 11.1946 7.17144 12.16 7.24477C13.6021 6.95147 14.983 6.10824 16.5228 6.21823C18.3681 6.36488 19.7613 7.09812 20.6779 8.41795C16.865 10.7032 17.7693 15.7259 21.2644 17.1313C20.5679 18.9644 19.6635 20.7853 18.1604 22.1296L18.1726 22.1173ZM12.0378 6.19379C11.8545 3.46858 14.0665 1.21997 16.6084 1C16.9628 4.15294 13.7487 6.49931 12.0378 6.19379Z"
      />
    </Svg>
  )
}
const IconApple = memo<IconProps>(themed(Apple))
export { IconApple }
