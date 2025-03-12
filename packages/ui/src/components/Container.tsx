import { SafeArea, type SafeAreaProps } from './SafeArea'
import { XStack, type XStackProps } from 'tamagui'

export const Container = ({
  children,
  safeAreaProps,
  ...props
}: XStackProps & { safeAreaProps?: SafeAreaProps }) => {
  return (
    <SafeArea {...safeAreaProps}>
      <XStack
        display={props.display ?? 'flex'}
        fd={props.fd ?? props.flexDirection ?? 'row'}
        px={props.px ?? props.paddingHorizontal ?? '$4'}
        als={props.als ?? props.alignSelf ?? 'center'}
        f={props.f ?? props.flex ?? 1}
        width={props.w ?? props.width ?? '100%'}
        {...props}
        $gtSm={{
          maxWidth: 768,
          ...(props.$gtSm ?? {}),
        }}
        $gtMd={{
          maxWidth: 960,
          px: '$6',
          ...(props.$gtMd ?? {}),
        }}
        $gtLg={{
          maxWidth: 1440,
          px: '$11',
          ...(props.$gtLg ?? {}),
        }}
        $gtXl={{
          maxWidth: 1920,
          ...(props.$gtXl ?? {}),
        }}
      >
        {children}
      </XStack>
    </SafeArea>
  )
}
