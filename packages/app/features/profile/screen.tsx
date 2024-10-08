import {
  Button,
  Fade,
  H1,
  H2,
  isWeb,
  Paragraph,
  Separator,
  Spinner,
  Stack,
  Text,
  useMedia,
  XStack,
  YStack,
} from '@my/ui'
import { useProfileLookup } from 'app/utils/useProfileLookup'
import { useUser } from 'app/utils/useUser'
import { AvatarProfile } from './AvatarProfile'
import { useInterUserActivityFeed } from './utils/useInterUserActivityFeed'
import type { Activity } from 'app/utils/zod/activity'
import { amountFromActivity } from 'app/utils/activity'
import { Fragment } from 'react'
import { useProfileScreenParams } from 'app/routers/params'
import { SendButton } from './ProfileButtons'

interface ProfileScreenProps {
  sendid?: number | null
}

export function ProfileScreen({ sendid: propSendid }: ProfileScreenProps) {
  const [{ sendid: paramSendid }] = useProfileScreenParams()
  const otherUserId = propSendid || Number(paramSendid)
  const {
    data: otherUserProfile,
    isLoading,
    error,
  } = useProfileLookup('sendid', otherUserId?.toString() || '')
  const { user, profile: currentUserProfile } = useUser()
  const media = useMedia()

  const {
    data,
    isLoading: isLoadingActivities,
    error: activitiesError,
    isFetching: isFetchingActivities,
    isFetchingNextPage: isFetchingNextPageActivities,
    fetchNextPage,
    hasNextPage,
  } = useInterUserActivityFeed({
    pageSize: 10,
    otherUserId,
    currentUserId: currentUserProfile?.send_id,
  })
  const { pages } = data ?? {}
  const formatTags = (tags: string[]) => tags?.map((tag) => `/${tag}`).join(' ')

  return (
    <>
      <YStack f={1} gap="$6">
        {error && <Text theme="red">{error.message}</Text>}
        {isLoading && (
          <Stack w="100%" h="100%" jc={'center'} ai={'center'} f={1} gap="$6">
            <Spinner size="large" color="$color10" />
          </Stack>
        )}
        {otherUserProfile ? (
          <YStack
            h={isWeb ? (media.shorter ? '83vh' : '88vh') : media.shorter ? '83%' : '88%'}
            $gtMd={{ height: 'auto' }}
          >
            <Stack py="$size.3.5" $gtLg={{ h: 'auto', pt: '$0' }}>
              <YStack width="100%" gap="$2">
                <YStack
                  jc="space-between"
                  ai="center"
                  mb="$size.3.5"
                  gap={'$size.1.5'}
                  $gtMd={{ flexDirection: 'row' }}
                >
                  <YStack
                    gap="$size.1.5"
                    ai={'center'}
                    jc={'center'}
                    $gtMd={{ width: 'auto', flexDirection: 'row' }}
                  >
                    <AvatarProfile profile={otherUserProfile} />
                    <YStack ai="center" $gtMd={{ ai: 'flex-start' }}>
                      <H1 nativeID="profileName" size={'$9'}>
                        {otherUserProfile.name}
                      </H1>
                      <H2 theme="green" color={'$color9'} size={'$5'} fontWeight={'600'}>
                        {formatTags(otherUserProfile.all_tags ?? [])}
                      </H2>
                      <Paragraph mt="$1" color={'$color10'}>
                        {otherUserProfile.about}
                      </Paragraph>
                    </YStack>
                  </YStack>

                  {Boolean(otherUserProfile) && user?.id !== otherUserProfile?.id ? (
                    <XStack
                      gap="$size.1.5"
                      ai={'center'}
                      display="none"
                      $gtMd={{ display: 'flex' }}
                    >
                      <SendButton
                        identifier={otherUserProfile?.tag ?? otherUserProfile?.sendid ?? ''}
                        idType={otherUserProfile?.tag ? 'tag' : 'sendid'}
                      />
                    </XStack>
                  ) : null}
                </YStack>

                <Separator />

                <YStack gap={'$size.0.9'}>
                  {(() => {
                    switch (true) {
                      case isLoadingActivities:
                        return <Spinner size="small" />
                      case activitiesError !== null:
                        return (
                          <Paragraph
                            maxWidth={'600'}
                            fontFamily={'$mono'}
                            fontSize={'$5'}
                            color={'$color12'}
                          >
                            {activitiesError?.message.split('.').at(0) ?? `${activitiesError}`}
                          </Paragraph>
                        )
                      case pages?.length === 0 || (pages && pages[0]?.length === 0):
                        return (
                          <>
                            <Paragraph
                              size={'$8'}
                              fontWeight={'300'}
                              color={'$color10'}
                              textAlign={'center'}
                              mt={'$size.1.5'}
                            >
                              No Activities
                            </Paragraph>
                          </>
                        )
                      default: {
                        let lastDate: string | undefined
                        return pages?.map((activities) => {
                          return activities?.map((activity) => {
                            const date = activity.created_at.toLocaleDateString(undefined, {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                            const isNewDate = !lastDate || date !== lastDate
                            if (isNewDate) {
                              lastDate = date
                            }
                            return (
                              <Fragment
                                key={`${activity.event_name}-${activity.created_at}-${activity?.from_user?.id}-${activity?.to_user?.id}`}
                              >
                                {isNewDate ? <DatePill date={date} /> : null}
                                <Fade>
                                  <TransactionEntry
                                    activity={activity}
                                    sent={activity?.to_user?.id !== user?.id}
                                  />
                                </Fade>
                              </Fragment>
                            )
                          })
                        })
                      }
                    }
                  })()}
                  <Fade>
                    {!isLoadingActivities && (isFetchingNextPageActivities || hasNextPage) ? (
                      <>
                        {isFetchingNextPageActivities && <Spinner size="small" />}
                        {hasNextPage && (
                          <Button
                            onPress={() => {
                              fetchNextPage()
                            }}
                            disabled={isFetchingNextPageActivities || isFetchingActivities}
                            color="$color"
                            width={200}
                            mx="auto"
                          >
                            Load More
                          </Button>
                        )}
                      </>
                    ) : null}
                  </Fade>
                </YStack>
              </YStack>
            </Stack>
          </YStack>
        ) : null}
      </YStack>
    </>
  )
}

const TransactionEntry = ({ activity, sent }: { activity: Activity; sent: boolean }) => {
  const { created_at } = activity
  const amount = amountFromActivity(activity)
  const date = new Date(created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

  return (
    <XStack justifyContent={sent ? 'flex-end' : 'flex-start'} testID="activityTest">
      <YStack
        bg={'$color1'}
        p={'$size.1.5'}
        borderRadius={'$4'}
        borderBottomRightRadius={sent ? 0 : '$4'}
        borderBottomLeftRadius={sent ? '$4' : 0}
      >
        <Paragraph fontWeight={'500'} size={'$5'} color={'$color8'} theme={sent ? 'red' : 'green'}>
          You {sent ? 'Sent' : 'Received'}
        </Paragraph>

        <Paragraph size={'$10'} $gtMd={{ size: '$12' }} textAlign="right">
          {amount}
        </Paragraph>
        <Paragraph size={'$2'} textAlign="right" color={'$color4'}>
          {date}
        </Paragraph>
      </YStack>
    </XStack>
  )
}

const DatePill = ({ date }: { date: string }) => {
  return (
    <XStack ai={'center'} py={'$size.0.9'}>
      <Paragraph
        ff={'$mono'}
        size={'$4'}
        py={'$size.0.25'}
        bc={'$color1'}
        color={'$color10'}
        px={'$size.0.9'}
        br={'$2'}
      >
        {date}
      </Paragraph>
    </XStack>
  )
}
