import { Button, Paragraph, XStack, type XStackProps } from '@my/ui'
import { IconX } from 'app/components/icons'
import { memo, useCallback, useMemo } from 'react'
import { useRouter } from 'solito/router'
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
  /** Callback when the chip is pressed (overrides default navigation) */
  onPress?: (label: ContactLabel) => void
  /** Callback when the delete button is pressed */
  onDelete?: (label: ContactLabel) => void
  /** Whether to enable navigation to contacts page on click (default: true in view mode) */
  enableNavigation?: boolean
}

/**
 * A small chip component for displaying contact labels.
 *
 * Styled to match sendtag chips with muted/tertiary appearance.
 * Clickable by default in view mode, navigating to contacts page filtered by label.
 *
 * Supports:
 * - Display mode: shows label name, clickable to navigate to /contacts?label={labelId}
 * - Selection mode: toggleable with selected state
 * - Edit mode: shows delete button
 *
 * @example
 * ```tsx
 * // Display mode (clickable, navigates to contacts page)
 * <LabelChip label={label} />
 *
 * // Selection mode (custom onPress, no navigation)
 * <LabelChip label={label} selected={isSelected} onPress={handleToggle} />
 *
 * // Edit mode with delete
 * <LabelChip label={label} showDelete onDelete={handleDelete} />
 *
 * // Disable navigation
 * <LabelChip label={label} enableNavigation={false} />
 * ```
 */
export const LabelChip = memo(function LabelChip({
  label,
  selected = false,
  showDelete = false,
  onPress,
  onDelete,
  enableNavigation = true,
  ...rest
}: LabelChipProps) {
  const router = useRouter()

  const handlePress = useCallback(() => {
    if (onPress) {
      onPress(label)
    } else if (enableNavigation) {
      router.push(`/contacts?label=${label.id}`)
    }
  }, [onPress, enableNavigation, label, router])

  const handleDelete = useCallback(() => {
    onDelete?.(label)
  }, [onDelete, label])

  // Determine if the chip is interactive
  const isInteractive = Boolean(onPress) || enableNavigation

  // Use style prop for custom colors in selection mode
  const containerStyle = useMemo(() => {
    if (selected && label.color) {
      return { backgroundColor: label.color }
    }
    return undefined
  }, [label.color, selected])

  return (
    <XStack
      testID={`labelChip-${label.id}`}
      backgroundColor={selected ? (label.color ? undefined : '$color8') : '$color3'}
      style={containerStyle}
      borderRadius={4}
      borderWidth={1}
      borderColor="$color8"
      px={8}
      py={4}
      alignItems="center"
      alignSelf="flex-start"
      gap="$1.5"
      pressStyle={isInteractive ? { opacity: 0.8, scale: 0.98 } : undefined}
      cursor={isInteractive ? 'pointer' : undefined}
      role={isInteractive ? 'button' : undefined}
      onPress={isInteractive ? handlePress : undefined}
      {...rest}
    >
      <Paragraph
        fontSize="$3"
        fontWeight="400"
        color={selected && label.color ? '$white' : '$color10'}
        numberOfLines={1}
      >
        {label.name}
      </Paragraph>

      {showDelete && (
        <Button
          size="$1"
          circular
          chromeless
          onPress={handleDelete}
          pressStyle={{ opacity: 0.7 }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <IconX size={12} color={selected && label.color ? '$white' : '$color11'} />
        </Button>
      )}
    </XStack>
  )
})
