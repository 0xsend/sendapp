import { XStack } from '@my/ui'
import { ColorTokens } from '@my/ui/types'
import { themed, IconProps } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'

const Ethereum = (props: IconProps) => {
  const { size, color, ...rest } = props
  return (
    <XStack
      width={'$1.5'}
      height={'$1.5'}
      backgroundColor={'$black'}
      borderRadius={999}
      jc={'center'}
      ai={'center'}>
      <Svg
        viewBox="0 0 12 18"
        color={color as ColorTokens | undefined}
        width={size ?? 12}
        height={size ?? 18}
        {...rest}
      >
        <Path d="M6.37476 0.00146484V6.65328L11.9967 9.16605L6.37476 0.00146484Z" fill="#C8C8C8" />
        <Path d="M6.37478 0.00146484L0.749573 9.16605L6.37478 6.65328V0.00146484Z" fill="white" />
        <Path d="M6.37476 13.478V17.9984L12 10.2124L6.37476 13.478Z" fill="#C8C8C8" />
        <Path d="M6.37478 17.9981V13.4777L0.749573 10.2153L6.37478 18.0013V17.9981Z" fill="white" />
        <Path d="M6.37476 12.4284L11.9967 9.16283L6.37476 6.65332V12.4284Z" fill="#A0A0A0" />
        <Path d="M0.749573 9.16624L6.37478 12.4319V6.65674L0.749573 9.16624Z" fill="#C8C8C8" />
      </Svg>
    </XStack>
  )
}
const IconEthereum = memo(themed(Ethereum))
export { IconEthereum }
