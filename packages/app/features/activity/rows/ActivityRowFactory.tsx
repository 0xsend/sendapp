/**
 * Factory component that renders the appropriate row based on ActivityRow kind.
 * Uses React Native StyleSheet for maximum performance.
 * Token values mapped from Tamagui theme.
 */

import { memo } from 'react'
import { View, Text, StyleSheet, type TextStyle } from 'react-native'
import { isWeb } from '@tamagui/constants'
import { FastImage } from '@my/ui'
import { IconCoin } from 'app/components/icons/IconCoin'
import { IconSendPotTicket } from 'app/components/icons/IconSendPotTicket'
import { IconUpgrade, IconBadgeCheckSolid2 } from 'app/components/icons'
import { AvatarSendEarnDeposit } from 'app/components/avatars'
import { AvatarSendEarnWithdraw } from 'app/components/avatars/AvatarSendEarnWithdraw'
import { Minus, Plus, ArrowDown, ArrowUp } from '@tamagui/lucide-icons'
import type {
  ActivityRow,
  UserTransferRow,
  SwapRow,
  SendpotRow,
  SendcheckRow,
  EarnRow,
  ExternalRow,
  UpgradeRow,
  TagReceiptRow,
  ReferralRow,
  SigningKeyRow,
  HeaderRow,
} from '../utils/activityRowTypes'

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

// Theme-aware color palettes
// Dark theme: light text on dark background
// Light theme: dark text on light background
const darkColors = {
  color12: '#FFFFFF', // Primary text
  color10: '#A1A1A1', // Secondary text
  color1: '#081619', // Background
  color2: '#082B1B', // Dark green background
  olive: '#86AE80',
  error: '#DE4747',
  white: '#FFFFFF',
  gray11: '#A1A1A1',
  background: '#081619',
  neon7: '#3EF851', // Verified badge
  neon8: '#5DFA6F',
  badgeCheckColor: '#082B1B',
}

const lightColors = {
  color12: '#081619', // Primary text (dark on light)
  color10: '#666666', // Secondary text
  color1: '#F7F7F7', // Background
  color2: '#E6F4EA', // Light green background
  olive: '#86AE80',
  error: '#DE4747',
  white: '#FFFFFF',
  gray11: '#666666',
  background: '#F7F7F7',
  neon7: '#22c55e', // Verified badge
  neon8: '#16a34a',
  badgeCheckColor: '#FFFFFF',
}

type ThemeColors = typeof darkColors

// Get colors based on theme
const getColors = (isDark: boolean): ThemeColors => (isDark ? darkColors : lightColors)

// Static layout styles (no colors)
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
  // Avatar
  avatarContainer: {
    width: 52,
    height: 52,
    position: 'relative',
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 1000000,
  },
  // Icon container
  iconContainer: {
    width: 52, // $5
    height: 52, // $5
    borderRadius: 9, // $4
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  // Sendpot icon
  sendpotIconBase: {
    width: 48, // $4.5
    height: 48, // $4.5
    borderRadius: 9, // $4
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Badge
  badgeBase: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 2,
  },
  badgeTop: {
    top: -5,
    right: -5,
    transform: [{ scale: 0.85 }],
  },
  badgeBottom: {
    bottom: -5,
    right: -5,
    transform: [{ scale: 0.85 }],
  },
  // Verified badge
  verifiedBadgeWrapper: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    zIndex: 100,
    transform: [{ translateX: 2 }, { translateY: 2 }],
  },
  // Placeholder avatar
  placeholderAvatarBase: {
    width: 48, // $4.5
    height: 48, // $4.5
    borderRadius: 9, // $4
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

interface RowBaseProps {
  isDark?: boolean
  colors: ThemeColors
}

// Base row data interface for RowLayout
interface RowData {
  title: string
  subtitle: string
  amount: string
  date: string
}

// Shared layout component for all activity rows
interface RowLayoutProps {
  avatar: React.ReactNode
  row: RowData
  colors: ThemeColors
}

const RowLayout = memo(({ avatar, row, colors }: RowLayoutProps) => (
  <View style={styles.rowOuter}>
    <View style={styles.rowInner}>
      {avatar}
      <View style={styles.textStack}>
        <View style={styles.topRow}>
          <Text
            style={[styles.titleTextBase, mediumWeight, { color: colors.color12 }]}
            numberOfLines={1}
          >
            {row.title}
          </Text>
          <View style={styles.spacer} />
          <Text
            style={[styles.amountTextBase, mediumWeight, { color: colors.color12 }]}
            numberOfLines={1}
          >
            {row.amount}
          </Text>
        </View>
        <Text style={[styles.subTextBase, { color: colors.color10 }]} numberOfLines={2}>
          {row.subtitle}
        </Text>
        <Text style={[styles.dateTextBase, { color: colors.color10 }]}>{row.date}</Text>
      </View>
    </View>
  </View>
))
RowLayout.displayName = 'RowLayout'

// Reusable avatar components
interface AvatarWithBadgeProps {
  avatarUrl: string
  isVerified?: boolean
  isDark?: boolean
}

const AvatarWithVerifiedBadge = memo(({ avatarUrl, isVerified, isDark }: AvatarWithBadgeProps) => (
  <View style={styles.avatarContainer}>
    <FastImage
      src={avatarUrl ? { uri: avatarUrl } : undefined}
      width={52}
      height={52}
      borderRadius={1000000}
      contentFit="cover"
    />
    {isVerified && (
      <View style={styles.verifiedBadgeWrapper}>
        <IconBadgeCheckSolid2
          size="$1"
          scale={0.7}
          // @ts-expect-error - not using tamagui token this time
          color={isDark ? darkColors.neon7 : lightColors.neon7}
          checkColor={isDark ? darkColors.badgeCheckColor : lightColors.badgeCheckColor}
        />
      </View>
    )}
  </View>
))
AvatarWithVerifiedBadge.displayName = 'AvatarWithVerifiedBadge'

const SimpleAvatar = memo(({ avatarUrl }: { avatarUrl: string }) => (
  <View style={styles.avatarContainer}>
    <FastImage
      src={avatarUrl ? { uri: avatarUrl } : undefined}
      width={52}
      height={52}
      borderRadius={1000000}
      contentFit="cover"
    />
  </View>
))
SimpleAvatar.displayName = 'SimpleAvatar'

const PlaceholderAvatar = memo(() => (
  <View style={[styles.placeholderAvatarBase, { backgroundColor: darkColors.olive }]} />
))
PlaceholderAvatar.displayName = 'PlaceholderAvatar'

// Icon with badge component for Swap/Sendcheck
interface IconWithBadgeProps {
  symbol: string
  BadgeIcon: typeof Plus | typeof Minus | typeof ArrowDown | typeof ArrowUp
  isPositive: boolean
  badgePosition: 'top' | 'bottom'
}

const IconWithBadge = memo(
  ({ symbol, BadgeIcon, isPositive, badgePosition }: IconWithBadgeProps) => (
    <View style={styles.iconContainer}>
      <IconCoin symbol={symbol} size="$5" />
      <View
        style={[
          styles.badgeBase,
          { borderColor: darkColors.color1 },
          badgePosition === 'top' ? styles.badgeTop : styles.badgeBottom,
          { backgroundColor: isPositive ? darkColors.olive : darkColors.error },
        ]}
      >
        <BadgeIcon
          size={16}
          // @ts-expect-error - not using tamagui token this time
          color={darkColors.white}
        />
      </View>
    </View>
  )
)
IconWithBadge.displayName = 'IconWithBadge'

// Row Components - now simplified to just provide their avatar
const UserTransferRowComponent = memo(
  ({ row, isDark, colors }: { row: UserTransferRow } & RowBaseProps) => (
    <RowLayout
      row={row}
      colors={colors}
      avatar={
        <AvatarWithVerifiedBadge
          avatarUrl={row.avatarUrl}
          isVerified={row.isVerified}
          isDark={isDark}
        />
      }
    />
  )
)
UserTransferRowComponent.displayName = 'UserTransferRow'

const SwapRowComponent = memo(({ row, colors }: { row: SwapRow } & RowBaseProps) => (
  <RowLayout
    row={row}
    colors={colors}
    avatar={
      <IconWithBadge
        symbol={row.coinSymbol}
        BadgeIcon={row.isBuy ? Plus : Minus}
        isPositive={row.isBuy}
        badgePosition="top"
      />
    }
  />
))
SwapRowComponent.displayName = 'SwapRow'

const SendpotRowComponent = memo(({ row, colors }: { row: SendpotRow } & RowBaseProps) => (
  <RowLayout
    row={row}
    colors={colors}
    avatar={
      <View style={[styles.sendpotIconBase, { backgroundColor: darkColors.olive }]}>
        <IconSendPotTicket color="$color2" />
      </View>
    }
  />
))
SendpotRowComponent.displayName = 'SendpotRow'

const SendcheckRowComponent = memo(({ row, colors }: { row: SendcheckRow } & RowBaseProps) => (
  <RowLayout
    row={row}
    colors={colors}
    avatar={
      <IconWithBadge
        symbol="SEND"
        BadgeIcon={row.isClaim ? ArrowDown : ArrowUp}
        isPositive={row.isClaim}
        badgePosition="bottom"
      />
    }
  />
))
SendcheckRowComponent.displayName = 'SendcheckRow'

const EarnRowComponent = memo(({ row, colors }: { row: EarnRow } & RowBaseProps) => {
  const EarnAvatar = row.isDeposit ? AvatarSendEarnDeposit : AvatarSendEarnWithdraw
  return <RowLayout row={row} colors={colors} avatar={<EarnAvatar />} />
})
EarnRowComponent.displayName = 'EarnRow'

const ExternalRowComponent = memo(({ row, colors }: { row: ExternalRow } & RowBaseProps) => (
  <RowLayout row={row} colors={colors} avatar={<SimpleAvatar avatarUrl={row.avatarUrl} />} />
))
ExternalRowComponent.displayName = 'ExternalRow'

const UpgradeRowComponent = memo(({ row, colors }: { row: UpgradeRow } & RowBaseProps) => (
  <RowLayout row={row} colors={colors} avatar={<IconUpgrade size="$4.5" br="$4" />} />
))
UpgradeRowComponent.displayName = 'UpgradeRow'

const TagReceiptRowComponent = memo(({ row, colors }: { row: TagReceiptRow } & RowBaseProps) => (
  <RowLayout row={row} colors={colors} avatar={<PlaceholderAvatar />} />
))
TagReceiptRowComponent.displayName = 'TagReceiptRow'

const ReferralRowComponent = memo(
  ({ row, isDark, colors }: { row: ReferralRow } & RowBaseProps) => (
    <RowLayout
      row={row}
      colors={colors}
      avatar={
        <AvatarWithVerifiedBadge
          avatarUrl={row.avatarUrl}
          isVerified={row.isVerified}
          isDark={isDark}
        />
      }
    />
  )
)
ReferralRowComponent.displayName = 'ReferralRow'

const SigningKeyRowComponent = memo(({ row, colors }: { row: SigningKeyRow } & RowBaseProps) => (
  <RowLayout row={row} colors={colors} avatar={<PlaceholderAvatar />} />
))
SigningKeyRowComponent.displayName = 'SigningKeyRow'

// Header Row
const HeaderRowComponent = memo(({ row, colors }: { row: HeaderRow; colors: ThemeColors }) => (
  <View style={[styles.headerContainerBase, { backgroundColor: colors.background }]}>
    <Text style={[styles.headerTextBase, { color: colors.gray11 }]}>{row.title}</Text>
  </View>
))
HeaderRowComponent.displayName = 'HeaderRow'

// Factory Component - pure render, no state or callbacks
interface ActivityRowFactoryProps {
  item: ActivityRow
  colors: ThemeColors
  isDark?: boolean
}

export const ActivityRowFactory = memo(
  ({ item, colors, isDark = true }: ActivityRowFactoryProps) => {
    switch (item.kind) {
      case 'header':
        return <HeaderRowComponent row={item} colors={colors} />
      case 'user-transfer':
        return <UserTransferRowComponent row={item} isDark={isDark} colors={colors} />
      case 'swap':
        return <SwapRowComponent row={item} colors={colors} />
      case 'sendpot':
        return <SendpotRowComponent row={item} colors={colors} />
      case 'sendcheck':
        return <SendcheckRowComponent row={item} colors={colors} />
      case 'earn':
        return <EarnRowComponent row={item} colors={colors} />
      case 'external':
        return <ExternalRowComponent row={item} colors={colors} />
      case 'upgrade':
        return <UpgradeRowComponent row={item} colors={colors} />
      case 'tag-receipt':
        return <TagReceiptRowComponent row={item} colors={colors} />
      case 'referral':
        return <ReferralRowComponent row={item} isDark={isDark} colors={colors} />
      case 'signing-key':
        return <SigningKeyRowComponent row={item} colors={colors} />
      default:
        return null
    }
  }
)
ActivityRowFactory.displayName = 'ActivityRowFactory'

// Export for parent to compute once
export { getColors, type ThemeColors }
