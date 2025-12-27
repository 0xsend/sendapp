import { Button, XStack, Text, type XStackProps } from '@my/ui'
import { IconX } from 'app/components/icons'
import { memo, useMemo } from 'react'
import type { ContactLabel } from '../types'

/**
 * Props for the LabelChip component.
 */
interface LabelChipProps extends Omit<XStackProps, 'onPress'> {
  /** The label to display */
  label: ContactLabel
  /** Whether the chip is selected (for selector mode) */
  selected?: boolean
  /** Whether to show the delete button */
  showDelete?: boolean
  /** Callback when the chip is pressed */
  onPress?: (label: ContactLabel) => void
  /** Callback when the delete button is pressed */
  onDelete?: (label: ContactLabel) => void
}

/**
 * A small chip component for displaying contact labels.
 *
 * Supports:
 * - Display mode: shows label name with optional color
 * - Selection mode: toggleable with selected state
 * - Edit mode: shows delete button
 *
 * @example
 * ```tsx
 * // Display mode
 * <LabelChip label={label} />
 *
 * // Selection mode
 * <LabelChip label={label} selected={isSelected} onPress={handleToggle} />
 *
 * // Edit mode with delete
 * <LabelChip label={label} showDelete onDelete={handleDelete} />
 * ```
 */
export const LabelChip = memo(function LabelChip({
  label,
  selected = false,
  showDelete = false,
  onPress,
  onDelete,
  ...rest
}: LabelChipProps) {
  const handlePress = () => {
    onPress?.(label)
  }

  const handleDelete = () => {
    onDelete?.(label)
  }

  // Use style prop for custom colors, fallback to theme tokens
  const containerStyle = useMemo(() => {
    if (label.color) {
      return { backgroundColor: label.color }
    }
    return undefined
  }, [label.color])

  return (
    <XStack
      backgroundColor={label.color ? undefined : selected ? '$color8' : '$color4'}
      style={containerStyle}
      borderRadius="$10"
      paddingHorizontal="$2.5"
      paddingVertical="$1.5"
      alignItems="center"
      gap="$1.5"
      pressStyle={onPress ? { opacity: 0.8, scale: 0.98 } : undefined}
      cursor={onPress ? 'pointer' : undefined}
      onPress={onPress ? handlePress : undefined}
      {...rest}
    >
      <Text
        fontSize="$2"
        fontWeight="500"
        color={label.color ? '$white' : selected ? '$color12' : '$color11'}
        numberOfLines={1}
      >
        {label.name}
      </Text>

      {showDelete && (
        <Button
          size="$1"
          circular
          chromeless
          onPress={handleDelete}
          pressStyle={{ opacity: 0.7 }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <IconX size={12} color={label.color ? '$white' : '$color11'} />
        </Button>
      )}
    </XStack>
  )
})
