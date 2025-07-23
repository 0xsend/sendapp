import { Avatar, LinkableAvatar, type LinkableAvatarProps, Spinner, XStack } from '@my/ui'
import { Minus, Plus, ArrowDown, ArrowUp } from '@tamagui/lucide-icons'
import { AvatarSendEarnDeposit } from 'app/components/avatars'
import { AvatarSendEarnWithdraw } from 'app/components/avatars/AvatarSendEarnWithdraw'
import { IconUpgrade } from 'app/components/icons'
import { IconCoin } from 'app/components/icons/IconCoin'
import { allCoinsDict } from 'app/data/coins'
import { ContractLabels } from 'app/data/contract-labels'
import {
  counterpart,
  isActivitySwapTransfer,
  isSendPotTicketPurchase,
  isSendPotWin,
  isSwapBuyTransfer,
} from 'app/utils/activity'
import { useAddressBook } from 'app/utils/useAddressBook'
import { useLiquidityPools } from 'app/utils/useLiquidityPools'
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

export function ActivityAvatar({
  activity,
  ...props
}: { activity: Activity } & Omit<LinkableAvatarProps, 'children' | 'href'>) {
  const user = counterpart(activity)
  const { data: swapRouters } = useSwapRouters()
  const { data: liquidityPools } = useLiquidityPools()
  const { from_user, to_user, data } = activity
  const isERC20Transfer = isSendAccountTransfersEvent(activity)
  const isETHReceive = isSendAccountReceiveEvent(activity)
  const addressBook = useAddressBook()

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
        position={'relative'}
      >
        <LinkableAvatar
          size="$5"
          gap="$2"
          href={`/profile/${user.send_id}`}
          circular={true}
          {...props}
        >
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
            <Avatar size="$5" {...props}>
              <Avatar.Image
                src={`https://ui-avatars.com/api/?name=${
                  user?.name ?? user?.main_tag_name ?? user?.send_id
                }&size=256&format=png&background=86ad7f`}
              />
            </Avatar>
          </Avatar.Fallback>
        </LinkableAvatar>
        <TransferDirectionIndicator activity={activity} />
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
