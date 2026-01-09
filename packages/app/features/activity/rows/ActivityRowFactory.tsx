/**
 * Factory component that renders the appropriate row based on ActivityRow kind.
 * Uses React Native StyleSheet for maximum performance.
 * Token values mapped from Tamagui theme.
 */

import { memo } from 'react'
import { View, Text, StyleSheet, type TextStyle } from 'react-native'
import { isWeb } from '@tamagui/constants'
import { View as TamaguiView } from 'tamagui'
import type { ActivityRow, HeaderRow } from '../utils/activityRowTypes'
import {
  ActivityAvatarFactory,
  getAvatarColors,
  type AvatarThemeColors,
} from '../avatars/ActivityAvatarFactory'

/**
 * Tamagui token mappings:
 * Space: $3.5=14, $1.5=6, $1=4, $0.5=2
 * Size: $5=52, $4.5=48, $4=44
 * Radius: $4=9
 * Font: $5=16/24, $4=14/20, $3=13/16 (size/lineHeight)
 * Font family: DM Sans (400=regular, 500=medium)
 * Colors (dark): $color12=#FFFFFF, $color10=#A1A1A1, $olive=#86AE80, $error=#DE4747, $color1=#081619
 */

// Font config matching Tamagui (packages/ui/src/config/fonts.ts)
// Web: uses font-family + font-weight (CSS handles variants)
// Native: uses specific font family names (weight baked in)
const fonts = isWeb
  ? {
      regular:
        'DM Sans, -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      medium:
        'DM Sans, -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    }
  : {
      regular: 'DM Sans',
      medium: 'DM Sans Medium',
    }

// On web, we need fontWeight for medium; on native, weight is in font family name
const mediumWeight: TextStyle = isWeb ? { fontWeight: '500' } : {}

// Theme-aware color palettes for row text
const darkColors = {
  color12: '#FFFFFF', // Primary text
  color10: '#A1A1A1', // Secondary text
  gray11: '#A1A1A1',
  background: '#081619',
}

const lightColors = {
  color12: '#081619', // Primary text (dark on light)
  color10: '#666666', // Secondary text
  gray11: '#666666',
  background: '#F7F7F7',
}

type ThemeColors = typeof darkColors

// Get colors based on theme
const getColors = (isDark: boolean): ThemeColors => (isDark ? darkColors : lightColors)

// Static layout styles
const styles = StyleSheet.create({
  // Row container
  rowOuter: {
    width: '100%',
    height: 102,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14, // $3.5
    borderRadius: 9, // $4
  },
  rowInner: {
    flexDirection: 'row',
    gap: 14, // $3.5
    width: '100%',
    flex: 1,
    alignItems: 'flex-start',
  },
  // Text stack
  textStack: {
    width: '100%',
    flex: 1,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6, // $1.5
    width: '100%',
  },
  titleTextBase: {
    fontSize: 16, // $5
    lineHeight: 24,
    fontFamily: fonts.medium, // 500 weight via font family (Android needs this)
    flexShrink: 1,
  },
  amountTextBase: {
    fontSize: 16, // $5
    lineHeight: 24,
    fontFamily: fonts.medium, // 500 weight via font family (Android needs this)
    textAlign: 'right',
  },
  subTextBase: {
    fontSize: 14, // $4
    lineHeight: 20,
    fontFamily: fonts.regular,
  },
  dateTextBase: {
    fontSize: 13, // $3
    lineHeight: 16,
    fontFamily: fonts.regular,
    opacity: 0.6,
    marginTop: 4,
  },
  // Header
  headerContainerBase: {
    height: 56,
    width: '100%',
    justifyContent: 'center',
    paddingVertical: 14, // $3.5
  },
  headerTextBase: {
    fontSize: 24, // $7
    lineHeight: 32,
    fontFamily: fonts.regular,
    fontWeight: '400',
  },
  // Spacer
  spacer: {
    width: 4,
  },
})

// Web hover styles (computed once, not per-render)
const webHoverStyleDark = {
  backgroundColor: 'rgba(255,255,255, 0.1)' as const,
  cursor: 'pointer' as const,
}
const webHoverStyleLight = {
  backgroundColor: 'rgba(0,0,0, 0.1)' as const,
  cursor: 'pointer' as const,
}

// Row content - renders avatar internally (Option 2: no JSX prop)
interface RowContentProps {
  item: Exclude<ActivityRow, HeaderRow>
  colors: ThemeColors
  avatarColors: AvatarThemeColors
  isDark: boolean
}

const RowContent = memo(({ item, colors, avatarColors, isDark }: RowContentProps) => (
  <View style={styles.rowInner}>
    <ActivityAvatarFactory item={item} colors={avatarColors} isDark={isDark} />
    <View style={styles.textStack}>
      <View style={styles.topRow}>
        <Text
          style={[styles.titleTextBase, mediumWeight, { color: colors.color12 }]}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        <View style={styles.spacer} />
        <Text
          style={[styles.amountTextBase, mediumWeight, { color: colors.color12 }]}
          numberOfLines={1}
        >
          {item.amount}
        </Text>
      </View>
      <Text style={[styles.subTextBase, { color: colors.color10 }]} numberOfLines={2}>
        {item.subtitle}
      </Text>
      <Text style={[styles.dateTextBase, { color: colors.color10 }]}>{item.date}</Text>
    </View>
  </View>
))
RowContent.displayName = 'RowContent'

// Shared layout component for all activity rows
// Now receives item data instead of avatar JSX (Option 2)
interface RowLayoutProps {
  item: Exclude<ActivityRow, HeaderRow>
  colors: ThemeColors
  avatarColors: AvatarThemeColors
  isDark: boolean
}

const RowLayout = memo(({ item, colors, avatarColors, isDark }: RowLayoutProps) => {
  if (isWeb) {
    // Web: Use Tamagui View for hover support
    return (
      <TamaguiView
        width="100%"
        height={102}
        alignItems="center"
        justifyContent="space-between"
        padding={14}
        borderRadius={9}
        hoverStyle={isDark ? webHoverStyleDark : webHoverStyleLight}
      >
        <RowContent item={item} colors={colors} avatarColors={avatarColors} isDark={isDark} />
      </TamaguiView>
    )
  }

  // Native: Use RN View for maximum performance
  return (
    <View style={styles.rowOuter}>
      <RowContent item={item} colors={colors} avatarColors={avatarColors} isDark={isDark} />
    </View>
  )
})
RowLayout.displayName = 'RowLayout'

// Header Row
const HeaderRowComponent = memo(({ row, colors }: { row: HeaderRow; colors: ThemeColors }) => (
  <View style={[styles.headerContainerBase, { backgroundColor: colors.background }]}>
    <Text style={[styles.headerTextBase, { color: colors.gray11 }]}>{row.title}</Text>
  </View>
))
HeaderRowComponent.displayName = 'HeaderRow'

// Memoization checkpoint for non-header rows (Option 1)
// This restores the memoization boundary we lost when removing type-specific row components
interface ActivityItemRowProps {
  item: Exclude<ActivityRow, HeaderRow>
  colors: ThemeColors
  avatarColors: AvatarThemeColors
  isDark: boolean
}

const ActivityItemRow = memo(({ item, colors, avatarColors, isDark }: ActivityItemRowProps) => (
  <RowLayout item={item} colors={colors} avatarColors={avatarColors} isDark={isDark} />
))
ActivityItemRow.displayName = 'ActivityItemRow'

// Factory Component - pure render, no state or callbacks
interface ActivityRowFactoryProps {
  item: ActivityRow
  colors: ThemeColors
  avatarColors: AvatarThemeColors
  isDark?: boolean
}

export const ActivityRowFactory = memo(
  ({ item, colors, avatarColors, isDark = true }: ActivityRowFactoryProps) => {
    if (item.kind === 'header') {
      return <HeaderRowComponent row={item} colors={colors} />
    }

    // Use ActivityItemRow as memoization checkpoint (Option 1)
    return (
      <ActivityItemRow item={item} colors={colors} avatarColors={avatarColors} isDark={isDark} />
    )
  }
)
ActivityRowFactory.displayName = 'ActivityRowFactory'

// Export for parent to compute once
export { getColors, getAvatarColors, type ThemeColors, type AvatarThemeColors }
