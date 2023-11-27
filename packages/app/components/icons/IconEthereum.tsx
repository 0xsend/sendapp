import { ColorTokens } from '@my/ui/types'
import { themed, IconProps } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'

const Ethereum = (props: IconProps) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      viewBox="0 0 24 24"
      color={color as ColorTokens | undefined}
      width={size ?? 24}
      height={size ?? 24}
      {...rest}
    >
      <Path
        fill="currentColor"
        d="M18.4589 11.7099L12.4037 2.62709C12.2018 2.32433 11.7982 2.32433 11.5963 2.62709L5.54113 11.7099C5.44021 11.9117 5.44021 12.1136 5.54113 12.3154L11.5963 21.3982C11.6972 21.4991 11.7982 21.6 12 21.6C12.2018 21.6 12.3028 21.4991 12.4037 21.3982L18.4589 12.3154C18.5598 12.1136 18.5598 11.9117 18.4589 11.7099ZM12 20.1871L7.35769 13.2237L11.7982 15.2421C11.8991 15.343 12.1009 15.343 12.2018 15.2421L16.6423 13.2237L12 20.1871ZM12 14.132L6.65125 11.7099L12 3.83813L17.3487 11.8108L12 14.132Z"
      />
    </Svg>
  )
}
const IconEthereum = memo(themed(Ethereum))
export { IconEthereum }
