import { XStack, XStackProps } from 'tamagui'

export const Container: React.FC<XStackProps> = (props: XStackProps) => {
  return (
    <XStack
      px="$6"
      als="center"
      f={1}
      width={'100%'}
      {...props}
      $gtSm={{
        maxWidth: 768,
        ...(props.$gtSm ?? {}),
      }}
      $gtMd={{
        maxWidth: 960,
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
      {props.children}
    </XStack>
  )
}
