import {
  Button,
  ButtonIcon,
  type ButtonProps,
  type ParagraphProps,
  withStaticProperties,
  type TamaguiElement,
} from 'tamagui'
import type { PropsWithChildren } from 'react'
import { forwardRef } from 'react'

/**
 * ActionButton - A styled button for secondary actions like "Add", "Edit", "Cancel".
 *
 * Uses the green theme for a consistent look with the app's accent colors.
 * Works well in both dark and light themes.
 *
 * @example
 * ```tsx
 * <ActionButton onPress={handleAdd} icon={<IconPlus size={16} />}>
 *   <ActionButton.Text>Add</ActionButton.Text>
 * </ActionButton>
 * ```
 */
export const _ActionButton = forwardRef<TamaguiElement | null, ButtonProps>(
  ({ children, size = '$3', ...props }, ref) => {
    return (
      <Button ref={ref} size={size} theme="green" borderRadius="$4" {...props}>
        {children}
      </Button>
    )
  }
)

_ActionButton.displayName = 'ActionButton'

/**
 * ActionButton.Text - Text component for ActionButton.
 * Uses proper color tokens that adapt to the green theme.
 */
export const ActionButtonText = ({ children, ...props }: PropsWithChildren & ParagraphProps) => {
  return (
    <Button.Text fontWeight="500" size="$3" color="$black" {...props}>
      {children}
    </Button.Text>
  )
}

/**
 * ActionButton with compound components.
 *
 * @example
 * ```tsx
 * // With icon and text
 * <ActionButton icon={<IconPlus size={16} />}>
 *   <ActionButton.Text>Add</ActionButton.Text>
 * </ActionButton>
 *
 * // Icon only
 * <ActionButton icon={<IconPlus size={16} />} />
 * ```
 */
export const ActionButton = withStaticProperties(_ActionButton, {
  Text: ActionButtonText,
  Icon: ButtonIcon,
})
