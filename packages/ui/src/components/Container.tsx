import { XStack, XStackProps } from 'tamagui'

export const Container: React.FC<XStackProps> = (props: XStackProps) => {
  return (
    <XStack
      px="$6"
      $gtSm={{
        maxWidth: 768,
      }}
      $gtMd={{
        maxWidth: 960,
      }}
      $gtLg={{
        maxWidth: 1440,
        px: '$11',
      }}
      $gtXl={{
        maxWidth: 1920,
      }}
      als="center"
      f={1}
      width={'100%'}
      {...props}
    >
      {props.children}
    </XStack>
  )
}
