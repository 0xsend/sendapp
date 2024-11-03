import { LinkableAvatar, Avatar } from '@my/ui'
import { IconCoin } from 'app/components/icons/IconCoin'
import { coinsDict } from 'app/data/coins'
import { counterpart } from 'app/utils/activity'
import {
  isSendAccountReceiveEvent,
  isSendAccountTransfersEvent,
  type Activity,
} from 'app/utils/zod/activity'

export function ActivityAvatar({ activity }: { activity: Activity }) {
  const user = counterpart(activity)
  const { from_user, to_user, data } = activity
  const isERC20Transfer = isSendAccountTransfersEvent(activity)

  const isETHReceive = isSendAccountReceiveEvent(activity)

  if (user) {
    return (
      <LinkableAvatar size="$4.5" br="$4" gap="$2" href={`/profile/${user.send_id}`}>
        {(() => {
          switch (true) {
            case !user.avatar_url:
              return <Avatar.Image src={undefined} />
            case Boolean(to_user?.send_id) && Boolean(from_user?.send_id):
              return <Avatar.Image src={user.avatar_url} />
            case isERC20Transfer || isETHReceive:
              return <IconCoin coin={coinsDict[data?.coin?.token as keyof typeof coinsDict]} />
            default:
              return <Avatar.Image src={user?.avatar_url ?? undefined} />
          }
        })()}

        <Avatar.Fallback jc="center" bc="$olive">
          <Avatar size="$4.5" br="$4">
            <Avatar.Image
              src={`https://ui-avatars.com/api/?name=${
                user?.name ?? user?.tags?.[0] ?? user?.send_id
              }&size=256&format=png&background=86ad7f`}
            />
          </Avatar>
        </Avatar.Fallback>
      </LinkableAvatar>
    )
  }

  if (isSendAccountTransfersEvent(activity)) {
    // is transfer, but an unknown user
    const address = from_user?.id ? activity.data.t : activity.data.f

    return (
      <Avatar size="$4.5" br="$4" gap="$2">
        <Avatar.Image
          src={`https://ui-avatars.com/api/?name=${address}&size=256&format=png&background=86ad7f`}
        />
        <Avatar.Fallback jc="center" bc="$olive">
          <Avatar size="$4.5" br="$4">
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
    <Avatar size="$4.5" br="$4" gap="$2">
      <Avatar.Image
        src={'https://ui-avatars.com/api/?name=TODO&size=256&format=png&background=86ad7f'}
      />
      <Avatar.Fallback jc="center" bc="$olive">
        <Avatar size="$4.5" br="$4">
          <Avatar.Image
            src={'https://ui-avatars.com/api/?name=TODO&size=256&format=png&background=86ad7f'}
          />
        </Avatar>
      </Avatar.Fallback>
    </Avatar>
  )
}
