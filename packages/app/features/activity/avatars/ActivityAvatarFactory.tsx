/**
 * Factory component that renders the appropriate avatar based on ActivityRow kind.
 * Single source of truth for activity avatar rendering.
 * Uses React Native StyleSheet for maximum performance.
 */

import { memo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { isWeb } from '@tamagui/constants'
import { FastImage } from '@my/ui'
import { IconCoin } from 'app/components/icons/IconCoin'
import { IconSendPotTicket } from 'app/components/icons/IconSendPotTicket'
import { IconBadgeCheckSolid2, IconKey, IconUpgrade } from 'app/components/icons'
import { AvatarSendEarnDeposit } from 'app/components/avatars'
import { AvatarSendEarnWithdraw } from 'app/components/avatars/AvatarSendEarnWithdraw'
import { ArrowDown, ArrowUp, Minus, Plus } from '@tamagui/lucide-icons'
import type { ActivityRow } from '../utils/activityRowTypes'

/**
 * Tamagui token mappings:
 * Size: $5=52, $4.5=48, $4=44
 * Radius: $4=9
 * Font: DM Sans (400=regular, 500=medium)
 * Colors (dark): $color12=#FFFFFF, $color10=#A1A1A1, $olive=#86AE80, $error=#DE4747, $color1=#081619
 */

// Font config matching Tamagui (packages/ui/src/config/fonts.ts)
const fonts = isWeb
  ? {
      medium:
        'DM Sans, -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    }
  : {
      medium: 'DM Sans Medium',
    }

// Theme-aware color palettes
const darkColors = {
  color1: '#081619',
  color2: '#082B1B',
  olive: '#86AE80',
  error: '#DE4747',
  white: '#FFFFFF',
  neon7: '#3EF851',
  badgeCheckColor: '#082B1B',
}

const lightColors = {
  color1: '#F7F7F7',
  color2: '#E6F4EA',
  olive: '#86AE80',
  error: '#DE4747',
  white: '#FFFFFF',
  neon7: '#22c55e',
  badgeCheckColor: '#FFFFFF',
}

export type AvatarThemeColors = typeof darkColors

export const getAvatarColors = (isDark: boolean): AvatarThemeColors =>
  isDark ? darkColors : lightColors

// Static layout styles
const styles = StyleSheet.create({
  avatarContainer: {
    marginTop: 4,
    width: 52,
    height: 52,
    position: 'relative',
  },
  iconContainer: {
    marginTop: 4,
    width: 52,
    height: 52,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  sendpotIconBase: {
    marginTop: 4,
    width: 48,
    height: 48,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeBase: {
    position: 'absolute',
    borderRadius: 999,
  },
  badgeTop: {
    top: 0,
    right: 0,
  },
  badgeBottom: {
    bottom: 0,
    right: 0,
  },
  verifiedBadgeWrapper: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    zIndex: 100,
    transform: [{ translateX: 2 }, { translateY: 2 }],
  },
})

// Avatar with optional verified badge (for user-transfer, referral)
interface AvatarWithBadgeProps {
  avatarUrl: string
  isVerified?: boolean
  isDark?: boolean
}

export const AvatarWithVerifiedBadge = memo(
  ({ avatarUrl, isVerified, isDark = true }: AvatarWithBadgeProps) => (
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
            size={16}
            // @ts-expect-error - not using tamagui token this time
            color={isDark ? darkColors.neon7 : lightColors.neon7}
            checkColor={isDark ? darkColors.badgeCheckColor : lightColors.badgeCheckColor}
          />
        </View>
      )}
    </View>
  )
)
AvatarWithVerifiedBadge.displayName = 'AvatarWithVerifiedBadge'

// Simple avatar without badge (for external transfers)
export const SimpleAvatar = memo(({ avatarUrl }: { avatarUrl: string }) => (
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

// Icon with badge (for swap, sendcheck, external withdraw/deposit)
interface IconWithBadgeProps {
  symbol: string
  BadgeIcon: typeof Plus | typeof Minus | typeof ArrowDown | typeof ArrowUp
  isPositive: boolean
  badgePosition: 'top' | 'bottom'
  colors: AvatarThemeColors
}

export const IconWithBadge = memo(
  ({ symbol, BadgeIcon, isPositive, badgePosition, colors }: IconWithBadgeProps) => (
    <View style={styles.iconContainer}>
      <IconCoin symbol={symbol} size="$5" />
      <View
        style={[
          styles.badgeBase,
          { borderColor: colors.color1 },
          badgePosition === 'top' ? styles.badgeTop : styles.badgeBottom,
          { backgroundColor: isPositive ? colors.olive : colors.error },
        ]}
      >
        <BadgeIcon
          size={16}
          // @ts-expect-error - not using tamagui token this time
          color={colors.white}
        />
      </View>
    </View>
  )
)
IconWithBadge.displayName = 'IconWithBadge'

// Sendpot avatar
export const SendpotAvatar = memo(() => (
  <View style={[styles.sendpotIconBase, { backgroundColor: darkColors.olive }]}>
    <IconSendPotTicket color="$color2" />
  </View>
))
SendpotAvatar.displayName = 'SendpotAvatar'

// Tag receipt avatar
export const TagReceiptAvatar = memo(({ colors }: { colors: AvatarThemeColors }) => (
  <View style={[styles.sendpotIconBase, { backgroundColor: colors.olive }]}>
    <Text style={{ color: darkColors.color2, fontSize: 28, fontFamily: fonts.medium }}>/</Text>
  </View>
))
TagReceiptAvatar.displayName = 'TagReceiptAvatar'

// Signing key avatar
export const SigningKeyAvatar = memo(({ colors }: { colors: AvatarThemeColors }) => (
  <View style={[styles.sendpotIconBase, { backgroundColor: colors.olive }]}>
    {/* @ts-expect-error - not using tamagui token */}
    <IconKey color={darkColors.color2} size={24} />
  </View>
))
SigningKeyAvatar.displayName = 'SigningKeyAvatar'

// Upgrade avatar
export const UpgradeAvatar = memo(() => <IconUpgrade size="$4.5" br="$4" />)
UpgradeAvatar.displayName = 'UpgradeAvatar'

// Main factory component
interface ActivityAvatarFactoryProps {
  item: Exclude<ActivityRow, { kind: 'header' }>
  colors: AvatarThemeColors
  isDark?: boolean
}

export const ActivityAvatarFactory = memo(
  ({ item, colors, isDark = true }: ActivityAvatarFactoryProps) => {
    switch (item.kind) {
      case 'user-transfer':
        return (
          <AvatarWithVerifiedBadge
            avatarUrl={item.avatarUrl}
            isVerified={item.isVerified}
            isDark={isDark}
          />
        )
      case 'swap':
        return (
          <IconWithBadge
            symbol={item.coinSymbol}
            BadgeIcon={item.isBuy ? Plus : Minus}
            isPositive={item.isBuy}
            badgePosition="top"
            colors={colors}
          />
        )
      case 'sendpot':
        return <SendpotAvatar />
      case 'sendcheck':
        return (
          <IconWithBadge
            symbol="SEND"
            BadgeIcon={item.isClaim ? ArrowDown : ArrowUp}
            isPositive={item.isClaim}
            badgePosition="bottom"
            colors={colors}
          />
        )
      case 'earn': {
        const EarnAvatar = item.isDeposit ? AvatarSendEarnDeposit : AvatarSendEarnWithdraw
        return <EarnAvatar />
      }
      case 'external':
        if ((item.isWithdraw || item.isDeposit) && item.coinSymbol) {
          return (
            <IconWithBadge
              symbol={item.coinSymbol}
              BadgeIcon={item.isWithdraw ? ArrowUp : ArrowDown}
              isPositive={item.isDeposit}
              badgePosition="bottom"
              colors={colors}
            />
          )
        }
        return <SimpleAvatar avatarUrl={item.avatarUrl} />
      case 'upgrade':
        return <UpgradeAvatar />
      case 'tag-receipt':
        return <TagReceiptAvatar colors={colors} />
      case 'referral':
        return (
          <AvatarWithVerifiedBadge
            avatarUrl={item.avatarUrl}
            isVerified={item.isVerified}
            isDark={isDark}
          />
        )
      case 'signing-key':
        return <SigningKeyAvatar colors={colors} />
      default:
        return null
    }
  }
)
ActivityAvatarFactory.displayName = 'ActivityAvatarFactory'
