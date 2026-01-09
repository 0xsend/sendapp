/**
 * Factory component that renders the appropriate row based on ActivityRow kind.
 * Uses React Native StyleSheet for maximum performance.
 * Token values mapped from Tamagui theme.
 *
 * Performance optimization: Each row type has its own content component with
 * inlined avatar rendering, eliminating the ActivityAvatarFactory switch.
 */

import { memo } from 'react'
import { View, Text, StyleSheet, type TextStyle, ActivityIndicator } from 'react-native'
import { isWeb } from '@tamagui/constants'
import { View as TamaguiView } from 'tamagui'
import { ArrowDown, ArrowUp, Minus, Plus } from '@tamagui/lucide-icons'
import { AvatarSendEarnDeposit } from 'app/components/avatars'
import { AvatarSendEarnWithdraw } from 'app/components/avatars/AvatarSendEarnWithdraw'
import type {
  ActivityRow,
  HeaderRow,
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
} from '../utils/activityRowTypes'
import {
  AvatarWithVerifiedBadge,
  SimpleAvatar,
  IconWithBadge,
  SendpotAvatar,
  TagReceiptAvatar,
  SigningKeyAvatar,
  UpgradeAvatar,
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
  // Spinner container (matches dateTextBase layout)
  spinnerContainer: {
    marginTop: 4,
    height: 16, // Match lineHeight of dateTextBase
    justifyContent: 'center',
    alignItems: 'flex-start',
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

// ============================================================================
// Row Layout - wraps content for web hover / native rendering
// ============================================================================

interface RowLayoutProps {
  children: React.ReactNode
  isDark: boolean
}

const RowLayout = memo(({ children, isDark }: RowLayoutProps) => {
  if (isWeb) {
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
        {children}
      </TamaguiView>
    )
  }

  return <View style={styles.rowOuter}>{children}</View>
})
RowLayout.displayName = 'RowLayout'

// ============================================================================
// Text Stack - shared text content for all row types
// ============================================================================

interface TextStackProps {
  title: string
  subtitle: string
  amount: string
  date: string
  isPending?: boolean
  colors: ThemeColors
}

const TextStack = memo(({ title, subtitle, amount, date, isPending, colors }: TextStackProps) => (
  <View style={styles.textStack}>
    <View style={styles.topRow}>
      <Text
        style={[styles.titleTextBase, mediumWeight, { color: colors.color12 }]}
        numberOfLines={1}
      >
        {title}
      </Text>
      <View style={styles.spacer} />
      <Text
        style={[styles.amountTextBase, mediumWeight, { color: colors.color12 }]}
        numberOfLines={1}
      >
        {amount}
      </Text>
    </View>
    <Text style={[styles.subTextBase, { color: colors.color10 }]} numberOfLines={2}>
      {subtitle}
    </Text>
    {isPending ? (
      <View style={styles.spinnerContainer}>
        <ActivityIndicator size="small" color={colors.color10} />
      </View>
    ) : (
      <Text style={[styles.dateTextBase, { color: colors.color10 }]}>{date}</Text>
    )}
  </View>
))
TextStack.displayName = 'TextStack'

// ============================================================================
// Type-Specific Row Content Components (with inlined avatars)
// ============================================================================

// User Transfer Row
interface UserTransferRowContentProps {
  item: UserTransferRow
  colors: ThemeColors
  isDark: boolean
}

const UserTransferRowContent = memo(({ item, colors, isDark }: UserTransferRowContentProps) => (
  <View style={styles.rowInner}>
    <AvatarWithVerifiedBadge
      avatarUrl={item.avatarUrl}
      isVerified={item.isVerified}
      isDark={isDark}
    />
    <TextStack
      title={item.title}
      subtitle={item.subtitle}
      amount={item.amount}
      date={item.date}
      isPending={item.isPending}
      colors={colors}
    />
  </View>
))
UserTransferRowContent.displayName = 'UserTransferRowContent'

// Swap Row
interface SwapRowContentProps {
  item: SwapRow
  colors: ThemeColors
  avatarColors: AvatarThemeColors
}

const SwapRowContent = memo(({ item, colors, avatarColors }: SwapRowContentProps) => (
  <View style={styles.rowInner}>
    <IconWithBadge
      symbol={item.coinSymbol}
      BadgeIcon={item.isBuy ? Plus : Minus}
      isPositive={item.isBuy}
      badgePosition="top"
      colors={avatarColors}
    />
    <TextStack
      title={item.title}
      subtitle={item.subtitle}
      amount={item.amount}
      date={item.date}
      isPending={item.isPending}
      colors={colors}
    />
  </View>
))
SwapRowContent.displayName = 'SwapRowContent'

// Sendpot Row
interface SendpotRowContentProps {
  item: SendpotRow
  colors: ThemeColors
}

const SendpotRowContent = memo(({ item, colors }: SendpotRowContentProps) => (
  <View style={styles.rowInner}>
    <SendpotAvatar />
    <TextStack
      title={item.title}
      subtitle={item.subtitle}
      amount={item.amount}
      date={item.date}
      isPending={item.isPending}
      colors={colors}
    />
  </View>
))
SendpotRowContent.displayName = 'SendpotRowContent'

// Sendcheck Row
interface SendcheckRowContentProps {
  item: SendcheckRow
  colors: ThemeColors
  avatarColors: AvatarThemeColors
}

const SendcheckRowContent = memo(({ item, colors, avatarColors }: SendcheckRowContentProps) => (
  <View style={styles.rowInner}>
    <IconWithBadge
      symbol="SEND"
      BadgeIcon={item.isClaim ? ArrowDown : ArrowUp}
      isPositive={item.isClaim}
      badgePosition="bottom"
      colors={avatarColors}
    />
    <TextStack
      title={item.title}
      subtitle={item.subtitle}
      amount={item.amount}
      date={item.date}
      isPending={item.isPending}
      colors={colors}
    />
  </View>
))
SendcheckRowContent.displayName = 'SendcheckRowContent'

// Earn Row
interface EarnRowContentProps {
  item: EarnRow
  colors: ThemeColors
}

const EarnRowContent = memo(({ item, colors }: EarnRowContentProps) => (
  <View style={styles.rowInner}>
    {item.isDeposit ? <AvatarSendEarnDeposit /> : <AvatarSendEarnWithdraw />}
    <TextStack
      title={item.title}
      subtitle={item.subtitle}
      amount={item.amount}
      date={item.date}
      isPending={item.isPending}
      colors={colors}
    />
  </View>
))
EarnRowContent.displayName = 'EarnRowContent'

// External Row
interface ExternalRowContentProps {
  item: ExternalRow
  colors: ThemeColors
  avatarColors: AvatarThemeColors
}

const ExternalRowContent = memo(({ item, colors, avatarColors }: ExternalRowContentProps) => (
  <View style={styles.rowInner}>
    {(item.isWithdraw || item.isDeposit) && item.coinSymbol ? (
      <IconWithBadge
        symbol={item.coinSymbol}
        BadgeIcon={item.isWithdraw ? ArrowUp : ArrowDown}
        isPositive={item.isDeposit}
        badgePosition="bottom"
        colors={avatarColors}
      />
    ) : (
      <SimpleAvatar avatarUrl={item.avatarUrl} />
    )}
    <TextStack
      title={item.title}
      subtitle={item.subtitle}
      amount={item.amount}
      date={item.date}
      isPending={item.isPending}
      colors={colors}
    />
  </View>
))
ExternalRowContent.displayName = 'ExternalRowContent'

// Upgrade Row
interface UpgradeRowContentProps {
  item: UpgradeRow
  colors: ThemeColors
}

const UpgradeRowContent = memo(({ item, colors }: UpgradeRowContentProps) => (
  <View style={styles.rowInner}>
    <UpgradeAvatar />
    <TextStack
      title={item.title}
      subtitle={item.subtitle}
      amount={item.amount}
      date={item.date}
      isPending={item.isPending}
      colors={colors}
    />
  </View>
))
UpgradeRowContent.displayName = 'UpgradeRowContent'

// Tag Receipt Row
interface TagReceiptRowContentProps {
  item: TagReceiptRow
  colors: ThemeColors
  avatarColors: AvatarThemeColors
}

const TagReceiptRowContent = memo(({ item, colors, avatarColors }: TagReceiptRowContentProps) => (
  <View style={styles.rowInner}>
    <TagReceiptAvatar colors={avatarColors} />
    <TextStack
      title={item.title}
      subtitle={item.subtitle}
      amount={item.amount}
      date={item.date}
      isPending={item.isPending}
      colors={colors}
    />
  </View>
))
TagReceiptRowContent.displayName = 'TagReceiptRowContent'

// Referral Row
interface ReferralRowContentProps {
  item: ReferralRow
  colors: ThemeColors
  isDark: boolean
}

const ReferralRowContent = memo(({ item, colors, isDark }: ReferralRowContentProps) => (
  <View style={styles.rowInner}>
    <AvatarWithVerifiedBadge
      avatarUrl={item.avatarUrl}
      isVerified={item.isVerified}
      isDark={isDark}
    />
    <TextStack
      title={item.title}
      subtitle={item.subtitle}
      amount={item.amount}
      date={item.date}
      isPending={item.isPending}
      colors={colors}
    />
  </View>
))
ReferralRowContent.displayName = 'ReferralRowContent'

// Signing Key Row
interface SigningKeyRowContentProps {
  item: SigningKeyRow
  colors: ThemeColors
  avatarColors: AvatarThemeColors
}

const SigningKeyRowContent = memo(({ item, colors, avatarColors }: SigningKeyRowContentProps) => (
  <View style={styles.rowInner}>
    <SigningKeyAvatar colors={avatarColors} />
    <TextStack
      title={item.title}
      subtitle={item.subtitle}
      amount={item.amount}
      date={item.date}
      isPending={item.isPending}
      colors={colors}
    />
  </View>
))
SigningKeyRowContent.displayName = 'SigningKeyRowContent'

// ============================================================================
// Header Row
// ============================================================================

const HeaderRowComponent = memo(({ row, colors }: { row: HeaderRow; colors: ThemeColors }) => (
  <View style={[styles.headerContainerBase, { backgroundColor: colors.background }]}>
    <Text style={[styles.headerTextBase, { color: colors.gray11 }]}>{row.title}</Text>
  </View>
))
HeaderRowComponent.displayName = 'HeaderRow'

// ============================================================================
// Main Factory Component
// ============================================================================

interface ActivityRowFactoryProps {
  item: ActivityRow
  colors: ThemeColors
  avatarColors: AvatarThemeColors
  isDark?: boolean
}

export const ActivityRowFactory = memo(
  ({ item, colors, avatarColors, isDark = true }: ActivityRowFactoryProps) => {
    switch (item.kind) {
      case 'header':
        return <HeaderRowComponent row={item} colors={colors} />
      case 'user-transfer':
        return (
          <RowLayout isDark={isDark}>
            <UserTransferRowContent item={item} colors={colors} isDark={isDark} />
          </RowLayout>
        )
      case 'swap':
        return (
          <RowLayout isDark={isDark}>
            <SwapRowContent item={item} colors={colors} avatarColors={avatarColors} />
          </RowLayout>
        )
      case 'sendpot':
        return (
          <RowLayout isDark={isDark}>
            <SendpotRowContent item={item} colors={colors} />
          </RowLayout>
        )
      case 'sendcheck':
        return (
          <RowLayout isDark={isDark}>
            <SendcheckRowContent item={item} colors={colors} avatarColors={avatarColors} />
          </RowLayout>
        )
      case 'earn':
        return (
          <RowLayout isDark={isDark}>
            <EarnRowContent item={item} colors={colors} />
          </RowLayout>
        )
      case 'external':
        return (
          <RowLayout isDark={isDark}>
            <ExternalRowContent item={item} colors={colors} avatarColors={avatarColors} />
          </RowLayout>
        )
      case 'upgrade':
        return (
          <RowLayout isDark={isDark}>
            <UpgradeRowContent item={item} colors={colors} />
          </RowLayout>
        )
      case 'tag-receipt':
        return (
          <RowLayout isDark={isDark}>
            <TagReceiptRowContent item={item} colors={colors} avatarColors={avatarColors} />
          </RowLayout>
        )
      case 'referral':
        return (
          <RowLayout isDark={isDark}>
            <ReferralRowContent item={item} colors={colors} isDark={isDark} />
          </RowLayout>
        )
      case 'signing-key':
        return (
          <RowLayout isDark={isDark}>
            <SigningKeyRowContent item={item} colors={colors} avatarColors={avatarColors} />
          </RowLayout>
        )
      default:
        return null
    }
  }
)
ActivityRowFactory.displayName = 'ActivityRowFactory'

// Export for parent to compute once
export { getColors, getAvatarColors, type ThemeColors, type AvatarThemeColors }
