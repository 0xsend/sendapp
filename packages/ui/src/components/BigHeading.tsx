import { H1, HeadingProps } from 'tamagui'

export const BigHeading = ({
  fontSize = 64,
  fontWeight = '900',
  lineHeight = 57,
  ...props
}: HeadingProps) => {
  return (
    <H1 fontSize={fontSize} lineHeight={lineHeight} {...props}>
      {props.children}
    </H1>
  )
}
