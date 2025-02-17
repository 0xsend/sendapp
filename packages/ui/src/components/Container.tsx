import { SafeArea, type SafeAreaProps } from './SafeArea'

export const Container: React.FC<SafeAreaProps> = ({ children, ...props }: SafeAreaProps) => {
  return (
    <SafeArea
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
    </SafeArea>
  )
}
