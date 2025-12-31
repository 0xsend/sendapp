import { memo, useCallback, useState, type ReactNode } from 'react'
import { Platform, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native'
import {
  Button,
  ButtonText,
  LinearGradient,
  Paragraph,
  ScrollView,
  Tooltip,
  useTheme,
  View,
  XStack,
  type XStackProps,
} from '@my/ui'
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
  const theme = useTheme()
  const [showLabelManager, setShowLabelManager] = useState(false)
  const [showLeftGradient, setShowLeftGradient] = useState(false)
  const [showRightGradient, setShowRightGradient] = useState(true)

  const handleFilterChange = useCallback(
    (newFilter: ContactFilter) => {
      setFilter(newFilter)
    },
    [setFilter]
  )

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent
    const scrollX = contentOffset.x
    const maxScrollX = contentSize.width - layoutMeasurement.width

    // Show left gradient when scrolled past threshold
    setShowLeftGradient(scrollX > 10)
    // Show right gradient when not scrolled to end
    setShowRightGradient(scrollX < maxScrollX - 10)
  }, [])

  return (
    <XStack gap="$3" alignItems="center" justifyContent="space-between">
      <View flex={1} minWidth={0} position="relative">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{
            gap: 8,
            paddingHorizontal: Platform.OS === 'web' ? 0 : 16,
          }}
          style={{ flex: 1, minWidth: 0 }}
        >
          <XStack gap="$2" {...containerProps}>
            {/* Active label first (if a label is selected) */}
            {showLabels &&
              filter.type === 'label' &&
              labels
                ?.filter((label) => label.id === filter.labelId)
                .map((label) => (
                  <LabelFilterChip
                    key={`label-${label.id}`}
                    label={label}
                    isActive={true}
                    onPress={() => handleFilterChange({ type: 'label', labelId: label.id })}
                  />
                ))}

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

            {/* Label filters (excluding active label which is shown first) */}
            {showLabels &&
              labels
                ?.filter((label) => !(filter.type === 'label' && filter.labelId === label.id))
                .map((label) => (
                  <LabelFilterChip
                    key={`label-${label.id}`}
                    label={label}
                    isActive={false}
                    onPress={() => handleFilterChange({ type: 'label', labelId: label.id })}
                  />
                ))}

            {/* Archived filter - at the end before manage button */}
            <FilterChip
              label="Archived"
              isActive={filter.type === 'archived'}
              onPress={() => handleFilterChange({ type: 'archived' })}
            />

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

        {/* Left fade gradient - shows when scrolled */}
        {showLeftGradient && (
          <LinearGradient
            pointerEvents="none"
            colors={[`${theme.background.val}`, `${theme.background.val}00`]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            width="$4"
            height="100%"
            position="absolute"
            top={0}
            left={0}
            zIndex={10}
          />
        )}

        {/* Right fade gradient - shows when more content available */}
        {showRightGradient && (
          <LinearGradient
            pointerEvents="none"
            colors={[`${theme.background.val}00`, `${theme.background.val}`]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            width="$4"
            height="100%"
            position="absolute"
            top={0}
            right={0}
            zIndex={10}
          />
        )}
      </View>

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
    <Tooltip placement="bottom" delay={300}>
      <Tooltip.Trigger>
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
          accessibilityLabel="Manage labels"
          icon={<IconPlus size={14} color="$color11" />}
        />
      </Tooltip.Trigger>
      <Tooltip.Content
        enterStyle={{ y: -5, opacity: 0 }}
        exitStyle={{ y: -5, opacity: 0 }}
        animation="quick"
        bg="$color2"
        borderWidth={1}
        borderColor="$color6"
        px="$2"
        py="$1.5"
      >
        <Paragraph size="$2" color="$color11">
          Manage Labels
        </Paragraph>
      </Tooltip.Content>
    </Tooltip>
  )
})

export default ContactFilters
