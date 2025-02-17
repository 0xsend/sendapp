import { type XStackProps, XStack } from 'tamagui'
import { useSafeAreaInsets, usePwa } from '../utils'

type SafeAreaValue = 't' | 'b' | 'r' | 'l' | 'x' | 'y'
type SafeAreaPadding = boolean | SafeAreaValue | SafeAreaValue[]

export type SafeAreaProps = XStackProps & {
  safeArea?: SafeAreaPadding
}

const PADDING_MAP = {
  y: ['pt', 'pb'],
  x: ['pr', 'pl'],
  t: ['pt'],
  b: ['pb'],
  r: ['pr'],
  l: ['pl'],
} as const

const INSET_MAP = {
  pt: 'top',
  pb: 'bottom',
  pr: 'right',
  pl: 'left',
} as const

export const SafeArea = ({ children, safeArea = true, ...props }: SafeAreaProps) => {
  const insets = useSafeAreaInsets()
  const isPwa = usePwa()

  if (!insets || typeof isPwa !== 'boolean') return null

  if (!isPwa) return <XStack {...props}>{children}</XStack>

  const calcSafeAreaPadding = () => {
    if (safeArea === true) {
      return {
        pt: insets.top,
        pb: insets.bottom,
        pr: insets.right,
        pl: insets.left,
      }
    }

    if (safeArea === false) {
      return undefined
    }

    const values = Array.isArray(safeArea) ? safeArea : [safeArea]

    return values
      .flatMap((value) => PADDING_MAP[value])
      .reduce(
        (acc, paddingKey) => {
          acc[paddingKey] = insets[INSET_MAP[paddingKey]]
          return acc
        },
        {} as Record<string, number>
      )
  }

  return (
    <XStack {...calcSafeAreaPadding()} {...props}>
      {children}
    </XStack>
  )
}
