import { XStack } from 'tamagui'

export type ContainerProps = {
  children: React.ReactNode
}

export const Container: React.FC<ContainerProps> = (props) => {
  return (
    <XStack maw={1480} als="center" f={1} pt="$13">
      {props.children}
    </XStack>
  )
}
