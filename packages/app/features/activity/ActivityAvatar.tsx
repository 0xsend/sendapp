import { Avatar, LinkableAvatar, type LinkableAvatarProps, XStack } from '@my/ui'
import { IconDeposit, IconUpgrade, IconWithdraw } from 'app/components/icons'
import { IconCoin } from 'app/components/icons/IconCoin'
import { allCoinsDict } from 'app/data/coins'
import {
  counterpart,
  isActivitySwapTransfer,
  isSendPotTicketPurchase,
  isSendPotWin,
  isSwapBuyTransfer,
} from 'app/utils/activity'
import {
  type Activity,
  isSendAccountReceiveEvent,
  isSendAccountTransfersEvent,
} from 'app/utils/zod/activity'
import { isSendTokenUpgradeEvent } from 'app/utils/zod/activity/SendAccountTransfersEventSchema'
import { useSwapRouters } from 'app/utils/useSwapRouters'
import { useLiquidityPools } from 'app/utils/useLiquidityPools'
import { Minus, Plus } from '@tamagui/lucide-icons'
import { IconSendPotTicket } from 'app/components/icons/IconSendPotTicket'
import {
  isSendEarnDepositEvent,
  isSendEarnEvent,
  isSendEarnWithdrawEvent,
} from 'app/utils/zod/activity/SendEarnEventSchema'

export function ActivityAvatar({
  activity,
  ...props
}: { activity: Activity } & Omit<LinkableAvatarProps, 'children' | 'href'>) {
  const user = counterpart(activity)
  const { data: swapRouters } = useSwapRouters()
  const { data: liquidityPools } = useLiquidityPools()
  const { from_user, to_user, data } = activity
  const isERC20Transfer = isSendAccountTransfersEvent(activity) || isSendEarnEvent(activity)
  const isETHReceive = isSendAccountReceiveEvent(activity)

  if (isSendPotTicketPurchase(activity) || isSendPotWin(activity)) {
    return (
      <XStack w="$4.5" h={'$4.5'} br="$4" bc={'$olive'}>
        <IconSendPotTicket color={'$color2'} />
      </XStack>
    )
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
      >
        <LinkableAvatar size="$4.5" br="$4" gap="$2" href={`/profile/${user.send_id}`} {...props}>
          {(() => {
            switch (true) {
              case !user.avatar_url:
                return <Avatar.Image src={undefined} />
              case Boolean(to_user?.send_id) && Boolean(from_user?.send_id):
                return <Avatar.Image src={user.avatar_url} />
              case isERC20Transfer || isETHReceive:
                return (
                  <IconCoin
                    symbol={
                      allCoinsDict[data?.coin?.token as keyof typeof allCoinsDict]?.symbol ?? ''
                    }
                  />
                )
              default:
                return <Avatar.Image src={user?.avatar_url ?? undefined} />
            }
          })()}

          <Avatar.Fallback jc="center" bc="$olive">
            <Avatar size="$4.5" br="$4" {...props}>
              <Avatar.Image
                src={`https://ui-avatars.com/api/?name=${
                  user?.name ?? user?.tags?.[0] ?? user?.send_id
                }&size=256&format=png&background=86ad7f`}
              />
            </Avatar>
          </Avatar.Fallback>
        </LinkableAvatar>
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
      return (
        <Avatar size="$4.5" br="$4" gap="$2" {...props}>
          <IconDeposit size="$5" />
        </Avatar>
      )
    }
    if (isSendEarnWithdrawEvent(activity)) {
      return (
        <Avatar size="$4.5" br="$4" gap="$2" {...props}>
          <IconWithdraw size="$5" />
        </Avatar>
      )
    }
  }
  if (isERC20Transfer) {
    // is transfer, but an unknown user
    const address = from_user?.id ? activity.data.t : activity.data.f

    return (
      <Avatar size="$4.5" br="$4" gap="$2" {...props}>
        <Avatar.Image
          src={`https://ui-avatars.com/api/?name=${address}&size=256&format=png&background=86ad7f`}
        />
        <Avatar.Fallback jc="center" bc="$olive">
          <Avatar size="$4.5" br="$4" {...props}>
            <Avatar.Image
              src={`https://ui-avatars.com/api/?name=${address}&size=256&format=png&background=86ad7f`}
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

const TradeActivityAvatar = ({ activity }: { activity: Activity }) => {
  const { data: swapRouters } = useSwapRouters()
  const isButTransfer = isSwapBuyTransfer(activity, swapRouters)
  const Icon = isButTransfer ? Plus : Minus

  return (
    <XStack w="$4.5" h={'$4.5'} br="$4" ai={'center'} jc={'center'} position={'relative'}>
      <IconCoin symbol={activity.data?.coin?.symbol ?? ''} width={'90%'} height={'90%'} />
      <Icon
        position={'absolute'}
        top={'-5%'}
        right={'-5%'}
        size={'$1'}
        bc={isButTransfer ? '$olive' : '$error'}
        borderRadius={999}
        shadowColor={'$black'}
        shadowOffset={{ width: 0, height: 2 }}
        shadowOpacity={1}
        shadowRadius={4}
      />
    </XStack>
  )
}
