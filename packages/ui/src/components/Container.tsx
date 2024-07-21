import { XStack, type XStackProps } from 'tamagui'
import { useSafeAreaInsets } from '../utils'

type Props = {
  safeAreaPadding?: boolean | 'y' | 'x' | 't' | 'b' | 'r' | 'l'
}

export const Container: React.FC<XStackProps & Props> = ({
  safeAreaPadding = false,
  ...props
}: XStackProps & Props) => {
  const { sat, sab, sar, sal } = useSafeAreaInsets()

  const calcSafeAreaPadding = () => {
    switch (safeAreaPadding) {
      case true:
        return { pr: sar, pl: sal, pb: sab, pt: sat }
      case 'y':
        return { pb: sab, pt: sat }
      case 'x':
        return { pr: sar, pl: sal }
      case 't':
        return { pt: sat }
      case 'b':
        return { pb: sab }
      case 'r':
        return { pr: sar }
      case 'l':
        return { pl: sal }
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
