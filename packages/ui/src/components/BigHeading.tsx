import { memo } from 'react'
import { H1, type HeadingProps } from 'tamagui'

const H1Memoized = memo(H1)
H1Memoized.displayName = 'H1'

export const BigHeading = ({
  fontSize = 64,
  fontWeight = '900',
  lineHeight = 64,
  ...props
}: HeadingProps) => {
  return (
    <H1 fontSize={fontSize} lineHeight={lineHeight} fontWeight={fontWeight} {...props}>
      {props.children}
    </H1>
  )
}
