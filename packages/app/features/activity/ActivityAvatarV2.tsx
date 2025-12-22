// optimized version of ActivityAvatar for the TokenActivityRowV2.tsx
import {
  Avatar,
  type LinkableAvatarProps,
  Spinner,
  styled,
  useThemeName,
  XStack,
  FastImage,
  useTheme,
} from '@my/ui'
import { Minus, Plus, ArrowDown, ArrowUp } from '@tamagui/lucide-icons'
import { AvatarSendEarnDeposit } from 'app/components/avatars'
import { AvatarSendEarnWithdraw } from 'app/components/avatars/AvatarSendEarnWithdraw'
import { IconUpgrade, IconBadgeCheckSolid2 } from 'app/components/icons'
import { IconCoin } from 'app/components/icons/IconCoin'
import { allCoinsDict } from 'app/data/coins'
import { ContractLabels } from 'app/data/contract-labels'
import { Link as SolitoLink } from 'solito/link'

import { isAndroid } from '@tamagui/constants'

import {
  counterpart,
  isActivitySwapTransfer,
  isSendCheckClaim,
  isSendCheckCreate,
  isSendCheckTransfer,
  isSendPotTicketPurchase,
  isSendPotWin,
  isSwapBuyTransfer,
} from 'app/utils/activity'
import type { useAddressBook } from 'app/utils/useAddressBook'
import type { useLiquidityPools } from 'app/utils/useLiquidityPools'
import { useSwapRouters } from 'app/utils/useSwapRouters'
import { IconSendPotTicket } from 'app/components/icons/IconSendPotTicket'
import {
  type Activity,
  isSendAccountReceiveEvent,
  isSendAccountTransfersEvent,
  isSendEarnDepositEvent,
  isSendEarnEvent,
  isSendEarnWithdrawEvent,
  isSendTokenUpgradeEvent,
} from 'app/utils/zod/activity'
import type { ImageStyle, StyleProp } from 'react-native'
import { memo, useMemo } from 'react'

interface ActivityAvatarProps extends Omit<LinkableAvatarProps, 'children' | 'href'> {
  activity: Activity
  swapRouters: ReturnType<typeof useSwapRouters>['data']
  liquidityPools: ReturnType<typeof useLiquidityPools>['data']
  addressBook: ReturnType<typeof useAddressBook>
}

const Link = styled(SolitoLink)

export const ActivityAvatar = memo(
  ({ activity, swapRouters, liquidityPools, addressBook, ...props }: ActivityAvatarProps) => {
    const user = counterpart(activity)
    const { from_user, to_user, data } = activity
    const isERC20Transfer = isSendAccountTransfersEvent(activity)
    const isETHReceive = isSendAccountReceiveEvent(activity)
    const theme = useThemeName()
    const themeObj = useTheme()
    const isDark = theme.includes('dark')

    const fastImageStyle = useMemo(
      () => ({ backgroundColor: themeObj.background.val }),
      [themeObj.background.val]
    )

    if (isSendPotTicketPurchase(activity) || isSendPotWin(activity)) {
      return (
        <XStack w="$4.5" h={'$4.5'} br="$4" bc={'$olive'}>
          <IconSendPotTicket color={'$color2'} />
        </XStack>
      )
    }

    if (isSendCheckTransfer(activity)) {
      return <SendCheckActivityAvatar activity={activity} />
    }

    if (isActivitySwapTransfer(activity, swapRouters, liquidityPools)) {
      return <TradeActivityAvatar activity={activity} />
    }

    if (user) {
      return (
        <XStack
          onPress={(e) => {
            e.stopPropagation()
          }}
          position={'relative'}
        >
          <Link w={52} h={52} gap="$2" href={`/profile/${user.send_id}`} br={1000_000} {...props}>
            {!user.avatar_url ? (
              <UserImage style={fastImageStyle} user={user} />
            ) : Boolean(to_user?.send_id) && Boolean(from_user?.send_id) ? (
              <FastImage
                contentFit="cover"
                src={user.avatar_url}
                width={52}
                height={52}
                borderRadius={1000_000}
                style={fastImageStyle}
              />
            ) : isERC20Transfer || isETHReceive ? (
              <IconCoin
                symbol={allCoinsDict[data?.coin?.token as keyof typeof allCoinsDict]?.symbol ?? ''}
              />
            ) : isAndroid && !user?.avatar_url ? (
              <UserImage style={fastImageStyle} user={user} />
            ) : (
              <FastImage
                src={user?.avatar_url ?? undefined}
                width={52}
                height={52}
                borderRadius={1000_000}
                style={fastImageStyle}
              />
            )}
          </Link>
          {user.is_verified && (
            <XStack zi={100} pos="absolute" bottom={0} right={0} x="$0.5" y="$0.5">
              <XStack pos="absolute" elevation={'$1'} scale={0.5} br={1000} inset={0} />
              <BadgeIcon isDark={isDark} />
            </XStack>
          )}
        </XStack>
      )
    }

    if (isSendTokenUpgradeEvent(activity)) {
      return (
        <Avatar size="$4.5" br="$4" gap="$2" {...props}>
          <IconUpgrade size="$4.5" br="$4" gap="$2" />
        </Avatar>
      )
    }

    if (isSendEarnEvent(activity)) {
      if (isSendEarnDepositEvent(activity)) {
        return <AvatarSendEarnDeposit {...props} />
      }
      if (isSendEarnWithdrawEvent(activity)) {
        return <AvatarSendEarnWithdraw {...props} />
      }
    }

    if (isERC20Transfer) {
      // is transfer, but an unknown user
      const address = from_user?.id ? activity.data.t : activity.data.f
      const name = addressBook?.data?.[address] ?? address

      if (name === ContractLabels.SendEarn) {
        if (from_user?.id) {
          return <AvatarSendEarnDeposit {...props} />
        }
        if (to_user?.id) {
          return <AvatarSendEarnWithdraw {...props} />
        }
      }

      if (addressBook.isLoading) {
        return (
          <Avatar size="$4.5" br="$4" gap="$2" {...props}>
            <Spinner size="small" />
          </Avatar>
        )
      }

      return (
        <Avatar size="$4.5" br="$4" gap="$2" {...props}>
          <Avatar.Image
            src={`https://ui-avatars.com/api/?name=${name}&size=256&format=png&background=86ad7f`}
          />
          <Avatar.Fallback jc="center" bc="$olive">
            <Avatar size="$4.5" br="$4" {...props}>
              <Avatar.Image
                src={`https://ui-avatars.com/api/?name=${name}&size=256&format=png&background=86ad7f`}
              />
            </Avatar>
          </Avatar.Fallback>
        </Avatar>
      )
    }

    // @todo make this an icon instead of a fallback TODO
    return (
      <Avatar size="$4.5" br="$4" gap="$2" {...props}>
        <Avatar.Image
          src={'https://ui-avatars.com/api/?name=TODO&size=256&format=png&background=86ad7f'}
        />
        <Avatar.Fallback jc="center" bc="$olive">
          <Avatar size="$4.5" br="$4" {...props}>
            <Avatar.Image
              src={'https://ui-avatars.com/api/?name=TODO&size=256&format=png&background=86ad7f'}
            />
          </Avatar>
        </Avatar.Fallback>
      </Avatar>
    )
  }
)

ActivityAvatar.displayName = 'ActivityAvatar'

const BadgeIcon = memo(({ isDark }: { isDark: boolean }) => {
  return (
    <IconBadgeCheckSolid2
      size="$1"
      scale={0.7}
      color="$neon8"
      $theme-dark={{ color: '$neon7' }}
      // @ts-expect-error - checkColor is not typed
      checkColor={isDark ? '#082B1B' : '#fff'}
    />
  )
})

BadgeIcon.displayName = 'BadgeIcon'

const TradeActivityAvatar = ({ activity }: { activity: Activity }) => {
  const { data: swapRouters } = useSwapRouters()
  const isBuyTransfer = isSwapBuyTransfer(activity, swapRouters)
  const Icon = isBuyTransfer ? Plus : Minus

  return (
    <XStack w="$5" h={'$5'} br="$4" ai={'center'} jc={'center'} position={'relative'}>
      <IconCoin symbol={activity.data?.coin?.symbol ?? ''} size={'$5'} />
      <XStack
        position={'absolute'}
        top={0}
        right={0}
        transform={'translate(5px, -5px) scale(0.85)'}
        bc={isBuyTransfer ? '$olive' : '$error'}
        borderRadius={999}
        borderWidth={2}
        borderColor={'$color1'}
      >
        <Icon size={'$1'} />
      </XStack>
    </XStack>
  )
}

const SendCheckActivityAvatar = ({ activity }: { activity: Activity }) => {
  const isClaim = isSendCheckClaim(activity)
  const Icon = isClaim ? ArrowDown : ArrowUp

  return (
    <XStack w="$5" h={'$5'} br="$4" ai={'center'} jc={'center'} position={'relative'}>
      <IconCoin symbol={activity.data?.coin?.symbol ?? ''} size={'$5'} />
      <XStack
        position={'absolute'}
        bottom={0}
        right={0}
        transform={'translate(5px, 5px) scale(0.85)'}
        bc={isClaim ? '$olive' : '$error'}
        borderRadius={999}
        borderWidth={2}
        borderColor={'$color1'}
      >
        <Icon size={'$1'} color={'$white'} />
      </XStack>
    </XStack>
  )
}

const TransferDirectionIndicator = ({ activity }: { activity: Activity }) => {
  const { to_user } = activity

  return (
    <XStack
      position={'absolute'}
      bottom={0}
      right={0}
      transform={'translate(5px, 5px) scale(0.85)'}
      bc={to_user?.id ? '$olive' : '$error'}
      borderRadius={999}
      borderWidth={2}
      borderColor={'$color1'}
    >
      {to_user?.id ? (
        <ArrowDown size={'$1'} color={'$white'} />
      ) : (
        <ArrowUp size={'$1'} color={'$white'} />
      )}
    </XStack>
  )
}

const UserImage = memo(
  ({
    user,
    style,
  }: { user?: Activity['from_user'] | Activity['to_user']; style?: StyleProp<ImageStyle> }) => {
    return (
      <FastImage
        src={`https://ui-avatars.com/api/?name=${
          user?.name ?? user?.main_tag_name ?? user?.send_id
        }&size=256&format=png&background=86ad7f`}
        width={52}
        height={52}
        borderRadius={1000_000}
        style={style}
      />
    )
  }
)

UserImage.displayName = 'UserImage'
