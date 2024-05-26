import { Avatar, Text, XStack, YStack, useMedia } from '@my/ui'
import { assert } from 'app/utils/assert'
import formatAmount from 'app/utils/formatAmount'
import type { Activity } from 'app/utils/zod/activity'

export function Row({ activity }: { activity: Activity }) {
  const media = useMedia()
  const { from_user, to_user, event_name, created_at, data } = activity
  const user = from_user ? from_user : to_user // will need to make this more robust and based on the event name

  assert(!!user, 'User is required')

  return (
    <XStack
      ai="center"
      jc="space-between"
      gap="$4"
      borderBottomWidth={1}
      pb="$5"
      borderBottomColor={'$decay'}
      $gtMd={{ borderBottomWidth: 0, pb: '0' }}
    >
      <XStack gap="$4.5">
        <Avatar size="$4.5" br="$4" gap="$2">
          <Avatar.Image src={user.avatar_url ?? undefined} />
          <Avatar.Fallback jc="center" bc="$olive">
            <Avatar size="$4.5" br="$4">
              <Avatar.Image
                src={`https://ui-avatars.com/api/?name=${
                  user.name ?? user.tags?.[0] ?? user.send_id
                }&size=256&format=png&background=86ad7f`}
              />
            </Avatar>
          </Avatar.Fallback>
        </Avatar>

        <YStack gap="$1.5">
          <Text color="$color12" fontSize="$7" $gtMd={{ fontSize: '$5' }}>
            {(() => {
              switch (true) {
                case event_name === 'send_account_transfers' && !!to_user?.id:
                  return 'Received'
                case event_name === 'send_account_transfers' && !!from_user?.id:
                  return 'Sent'
                default:
                  return event_name
                    .split('_')
                    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                    .join(' ')
              }
            })()}
          </Text>
          <Text
            theme="alt2"
            color="$olive"
            fontFamily={'$mono'}
            fontSize="$4"
            $gtMd={{ fontSize: '$2' }}
            maxWidth={'100%'}
            overflow={'hidden'}
          >
            {(() => {
              if (user.tags?.[0]) {
                return `@${user.tags[0]}`
              }

              return `#${user.send_id}`
            })()}
          </Text>
        </YStack>
      </XStack>
      <XStack gap="$4">
        {created_at ? (
          <Text
            color="$color12"
            display="none"
            minWidth={'$14'}
            textAlign="right"
            $gtMd={{ display: 'flex', jc: 'flex-end' }}
          >
            {new Date(created_at).toLocaleString()}
          </Text>
        ) : null}
        <Text
          color="$color12"
          textAlign="right"
          fontSize="$7"
          // @NOTE: font families don't change in `$gtMd` breakpoint
          fontFamily={media.md ? '$mono' : '$body'}
          $gtMd={{ fontSize: '$5', minWidth: '$14' }}
        >
          {(() => {
            switch (true) {
              case event_name === 'send_account_transfers': {
                const tfr = data as unknown as {
                  f: `\\x${string}`
                  t: `\\x${string}`
                  v: string
                  log_addr: `\\x${string}`
                  tx_hash: `\\x${string}`
                }
                // @todo lookup token info
                // tfr.log_addr
                // @todo if no from/to user, lookup address or show unknown sender/receiver
                return formatAmount(`${tfr.v}`, 5, 0)
              }
              case event_name === 'tag_receipts': {
                const tr = data as unknown as { tags: string[]; value: string }
                return formatAmount(`${tr.value}`, 5, 0)
              }
              default:
                return JSON.stringify(data, null, 2)
            }
          })()}
        </Text>
      </XStack>
    </XStack>
  )
}
