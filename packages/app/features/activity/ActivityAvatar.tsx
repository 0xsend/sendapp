import { Avatar, LinkableAvatar, XStack, type LinkableAvatarProps } from '@my/ui'
import { IconUpgrade } from 'app/components/icons'
import { IconCoin } from 'app/components/icons/IconCoin'
import { allCoinsDict } from 'app/data/coins'
import { counterpart } from 'app/utils/activity'
import {
  isSendAccountReceiveEvent,
  isSendAccountTransfersEvent,
  type Activity,
} from 'app/utils/zod/activity'
import { isSendTokenUpgradeEvent } from 'app/utils/zod/activity/SendAccountTransfersEventSchema'

export function ActivityAvatar({
  activity,
  ...props
}: { activity: Activity } & Omit<LinkableAvatarProps, 'children' | 'href'>) {
  const user = counterpart(activity)
  const { from_user, to_user, data } = activity
  const isERC20Transfer = isSendAccountTransfersEvent(activity)

  const isETHReceive = isSendAccountReceiveEvent(activity)

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
                    symbol={allCoinsDict[data?.coin?.token as keyof typeof allCoinsDict].symbol}
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
    return <IconUpgrade size="$4.5" br="$4" gap="$2" />
  }

  if (isSendAccountTransfersEvent(activity)) {
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
