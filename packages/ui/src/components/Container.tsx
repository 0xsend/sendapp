import { XStack } from 'tamagui'

export type ContainerProps = {
  children: React.ReactNode
}

export const Container: React.FC<ContainerProps> = (props) => {
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
        maxWidth: 1200,
        px: '$8',
      }}
      $gtXl={{
        maxWidth: 1440,
      }}
      als="center"
      f={1}
      width={'100%'}
    >
      {props.children}
    </XStack>
  )
}
