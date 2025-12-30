import { memo, useCallback, useState, type ReactNode } from 'react'
import { Platform } from 'react-native'
import { Button, ButtonText, ScrollView, XStack, type XStackProps } from '@my/ui'
import { useThemeName } from 'tamagui'
import { IconPlus } from 'app/components/icons'
import { useContactBook } from '../ContactBookProvider'
import { useContactLabels } from '../hooks/useContactLabels'
import type { ContactFilter, ContactLabel, ContactSource } from '../types'
import { LabelManagerSheet } from './LabelManagerSheet'

/**
 * Props for ContactFilters component.
 */
export interface ContactFiltersProps extends Omit<XStackProps, 'children'> {
  /** Whether to show label filters */
  showLabels?: boolean
  /** Whether to show source filters */
  showSources?: boolean
  /** Element to render on the right side (e.g., Add button) */
  rightElement?: ReactNode
}

/**
 * Available source filter options.
 */
const SOURCE_FILTERS: { source: ContactSource; label: string }[] = [
  { source: 'activity', label: 'Activity' },
  { source: 'manual', label: 'Manual' },
  { source: 'referral', label: 'Referral' },
  { source: 'external', label: 'External' },
]

/**
 * ContactFilters provides filter chips for filtering contacts.
 *
 * Features:
 * - All/Favorites quick filters
 * - Label-based filters (from user's custom labels)
 * - Source-based filters (activity, manual, referral)
 * - Horizontal scrolling for overflow
 * - Uses ContactBookProvider context for state
 *
 * @example
 * ```tsx
 * <ContactBookProvider>
 *   <ContactSearchBar />
 *   <ContactFilters showLabels showSources />
 *   <ContactList />
 * </ContactBookProvider>
 * ```
 */
export const ContactFilters = memo(function ContactFilters({
  showLabels = true,
  showSources = false,
  rightElement,
  ...containerProps
}: ContactFiltersProps) {
  const { filter, setFilter } = useContactBook()
  const { data: labels } = useContactLabels()
  const [showLabelManager, setShowLabelManager] = useState(false)

  const handleFilterChange = useCallback(
    (newFilter: ContactFilter) => {
      setFilter(newFilter)
    },
    [setFilter]
  )

  return (
    <XStack gap="$3" alignItems="center" justifyContent="space-between">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          gap: 8,
          paddingHorizontal: Platform.OS === 'web' ? 0 : 16,
        }}
        style={{ overflow: 'visible', flex: 1 }}
      >
        <XStack gap="$2" {...containerProps}>
          {/* All filter */}
          <FilterChip
            label="All"
            isActive={filter.type === 'all'}
            onPress={() => handleFilterChange({ type: 'all' })}
          />

          {/* Favorites filter */}
          <FilterChip
            label="Favorites"
            isActive={filter.type === 'favorites'}
            onPress={() => handleFilterChange({ type: 'favorites' })}
          />

          {/* Archived filter */}
          <FilterChip
            label="Archived"
            isActive={filter.type === 'archived'}
            onPress={() => handleFilterChange({ type: 'archived' })}
          />

          {/* Label filters */}
          {showLabels &&
            labels?.map((label) => (
              <LabelFilterChip
                key={`label-${label.id}`}
                label={label}
                isActive={filter.type === 'label' && filter.labelId === label.id}
                onPress={() => handleFilterChange({ type: 'label', labelId: label.id })}
              />
            ))}

          {/* Add label button */}
          {showLabels && <AddLabelButton onPress={() => setShowLabelManager(true)} />}

          {/* Source filters */}
          {showSources &&
            SOURCE_FILTERS.map(({ source, label }) => (
              <FilterChip
                key={`source-${source}`}
                label={label}
                isActive={filter.type === 'source' && filter.source === source}
                onPress={() => handleFilterChange({ type: 'source', source })}
              />
            ))}
        </XStack>
      </ScrollView>

      {rightElement}

      {/* Label manager sheet */}
      <LabelManagerSheet open={showLabelManager} onOpenChange={setShowLabelManager} />
    </XStack>
  )
})

/**
 * Props for FilterChip component.
 */
interface FilterChipProps {
  label: string
  isActive: boolean
  onPress: () => void
}

/**
 * Basic filter chip button.
 */
const FilterChip = memo(function FilterChip({ label, isActive, onPress }: FilterChipProps) {
  const theme = useThemeName()
  const isDark = theme?.startsWith('dark')

  return (
    <Button
      testID={`filterChip-${label.toLowerCase()}`}
      size="$3"
      br="$10"
      px="$3"
      py="$2"
      bc={isActive ? (isDark ? '$primary' : '$color12') : '$color3'}
      borderWidth={1}
      borderColor={isActive ? (isDark ? '$primary' : '$color12') : '$color6'}
      pressStyle={{
        bc: isActive ? (isDark ? '$primary' : '$color12') : '$color4',
        scale: 0.98,
      }}
      hoverStyle={{
        bc: isActive ? (isDark ? '$primary' : '$color12') : '$color4',
      }}
      onPress={onPress}
      accessibilityRole="button"
      aria-selected={isActive}
    >
      <ButtonText
        color={isActive ? (isDark ? '$color1' : '$color1') : '$color11'}
        size="$3"
        fontWeight={isActive ? '600' : '400'}
      >
        {label}
      </ButtonText>
    </Button>
  )
})

/**
 * Props for LabelFilterChip component.
 */
interface LabelFilterChipProps {
  label: ContactLabel
  isActive: boolean
  onPress: () => void
}

/**
 * Filter chip for custom labels.
 *
 * Note: Custom label colors are currently not supported due to Tamagui
 * type constraints. This uses standard theme colors for now.
 * TODO: Support custom label colors in a future update.
 */
const LabelFilterChip = memo(function LabelFilterChip({
  label,
  isActive,
  onPress,
}: LabelFilterChipProps) {
  const theme = useThemeName()
  const isDark = theme?.startsWith('dark')

  return (
    <Button
      testID={`filterChip-label-${label.id}`}
      size="$3"
      br="$10"
      px="$3"
      py="$2"
      bc={isActive ? (isDark ? '$primary' : '$color12') : '$color3'}
      borderWidth={1}
      borderColor={isActive ? (isDark ? '$primary' : '$color12') : '$color6'}
      pressStyle={{
        bc: isActive ? (isDark ? '$primary' : '$color12') : '$color4',
        scale: 0.98,
      }}
      hoverStyle={{
        bc: isActive ? (isDark ? '$primary' : '$color12') : '$color4',
      }}
      onPress={onPress}
      accessibilityRole="button"
      aria-selected={isActive}
    >
      <ButtonText
        color={isActive ? '$color1' : '$color11'}
        size="$3"
        fontWeight={isActive ? '600' : '400'}
      >
        {label.name}
      </ButtonText>
    </Button>
  )
})

/**
 * Props for AddLabelButton component.
 */
interface AddLabelButtonProps {
  onPress: () => void
}

/**
 * Button to open the label manager.
 */
const AddLabelButton = memo(function AddLabelButton({ onPress }: AddLabelButtonProps) {
  return (
    <Button
      testID="filterChip-add-label"
      size="$3"
      br="$10"
      px="$3"
      py="$2"
      bc="$color3"
      borderWidth={1}
      borderColor="$color6"
      borderStyle="dashed"
      pressStyle={{
        bc: '$color4',
        scale: 0.98,
      }}
      hoverStyle={{
        bc: '$color4',
      }}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Add new label"
      icon={<IconPlus size={14} color="$color11" />}
    />
  )
})

export default ContactFilters
