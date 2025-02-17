import { XStack, type XStackProps } from 'tamagui'
import { useSafeAreaInsets } from '../utils'

type Props = {
  safeAreaPadding?: boolean | 'y' | 'x' | 't' | 'b' | 'r' | 'l'
}

export const Container: React.FC<XStackProps & Props> = ({
  safeAreaPadding = false,
  ...props
}: XStackProps & Props) => {
  const insets = useSafeAreaInsets()

  const calcSafeAreaPadding = () => {
    switch (safeAreaPadding) {
      case true:
        return { pr: insets?.right, pl: insets?.left, pb: insets?.bottom, pt: insets?.top }
      case 'y':
        return { pb: insets?.bottom, pt: insets?.top }
      case 'x':
        return { pr: insets?.right, pl: insets?.left }
      case 't':
        return { pt: insets?.top }
      case 'b':
        return { pb: insets?.bottom }
      case 'r':
        return { pr: insets?.right }
      case 'l':
        return { pl: insets?.left }
      default:
        return undefined
    }
  }

  return (
    <XStack
      px="$4"
      als="center"
      f={1}
      width={'100%'}
      {...calcSafeAreaPadding()}
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
      {props.children}
    </XStack>
  )
}
