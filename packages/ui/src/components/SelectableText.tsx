import { Paragraph, styled } from 'tamagui'

/**
 * Text component with user-selectable content and styled selection highlight.
 * Uses green highlight on web via CSS className (native ignores this).
 */
export const SelectableText = styled(Paragraph, {
  name: 'SelectableText',
  userSelect: 'text',
  className: 'selectable-value',
})
