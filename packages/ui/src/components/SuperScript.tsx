import { TextProps, XStack, Text, getTokens } from 'tamagui'

export const Sup = (
  props: TextProps & {
    super: string
  }
) => {
  const { fontSize: fontSizeToken, fontWeight, color, children, ...rest } = props

  const fontSize =
    typeof fontSizeToken === 'string' ? getTokens().radius[fontSizeToken].val : fontSizeToken

  const superFontSize = Math.floor(fontSize * 0.6)

  const superlineHeight = superFontSize * 1.1 // Make sure the superscript lineheght always matches the height of the text

  return (
    <XStack fd="row" ai="flex-start">
      <Text
        textAlignVertical="bottom"
        fontSize={fontSize}
        fontWeight={fontWeight}
        col={color}
        {...rest}
      >
        {props.children}
      </Text>
      <Text
        textAlignVertical="top"
        fontSize={superFontSize}
        lh={superlineHeight}
        fontWeight={fontWeight}
        col={color || props.col}
      >
        {props.super}
      </Text>
    </XStack>
  )
}
