import { Fade, Paragraph, Spinner, Stack, Text, XStack, YStack } from '@my/ui'
import { useProfileLookup } from 'app/utils/useProfileLookup'
import { useUser } from 'app/utils/useUser'
import { AvatarProfile, type AvatarProfileProps } from './AvatarProfile'
import { useInterUserActivityFeed } from './utils/useInterUserActivityFeed'
import type { Activity } from 'app/utils/zod/activity'
import { amountFromActivity } from 'app/utils/activity'
import { useProfileScreenParams, useRootScreenParams } from 'app/routers/params'
import { IconArrowRight } from 'app/components/icons'
import { SendButton } from './ProfileButtons'
import { ProfileHeader } from 'app/features/profile/components/ProfileHeader'
import { FlatList } from 'react-native-web'
import { ProfilesDetailsModal } from 'app/features/profile/components/ProfileDetailsModal'

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
  const [{ profile: profileParam }] = useRootScreenParams()

  const {
    data,
    isLoading: isLoadingActivities,
    error: activitiesError,
    isFetchingNextPage: isFetchingNextPageActivities,
    fetchNextPage,
  } = useInterUserActivityFeed({
    pageSize: 10,
    otherUserId,
    currentUserId: currentUserProfile?.send_id,
  })
  const { pages } = data ?? {}

  return (
    <XStack w={'100%'} gap={'$4'} height={'100%'}>
      <YStack
        f={1}
        height={'100%'}
        gap={'$2'}
        display={profileParam ? 'none' : 'flex'}
        overflow={'hidden'}
        $gtLg={{
          display: 'flex',
          maxWidth: '50%',
        }}
      >
        {otherUserProfile && <ProfileHeader profile={otherUserProfile} />}
        {error && (
          <Text theme="red" color={'$color8'}>
            {error.message}
          </Text>
        )}
        {isLoading && (
          <Stack w="100%" h="100%" jc={'center'} ai={'center'} f={1} gap="$6">
            <Spinner size="large" color="$primary" />
          </Stack>
        )}
        {otherUserProfile ? (
          <>
            {(() => {
              switch (true) {
                case isLoadingActivities:
                  return (
                    <YStack f={1}>
                      <Spinner size="small" color={'$primary'} mt={'$8'} />
                    </YStack>
                  )
                case activitiesError !== null:
                  return (
                    <YStack f={1}>
                      <Paragraph
                        maxWidth={'600'}
                        fontFamily={'$mono'}
                        fontSize={'$5'}
                        theme={'red'}
                        color={'$color8'}
                        mt={'$4'}
                        ta={'center'}
                      >
                        {activitiesError?.message.split('.').at(0) ?? `${activitiesError}`}
                      </Paragraph>
                    </YStack>
                  )
                case pages?.length === 0 || (pages && pages[0]?.length === 0):
                  return (
                    <YStack f={1}>
                      <Paragraph
                        size={'$8'}
                        fontWeight={'300'}
                        color={'$color10'}
                        textAlign={'center'}
                        mt={'$size.1.5'}
                      >
                        No Activities
                      </Paragraph>
                    </YStack>
                  )
                default: {
                  const activities = pages?.flat() || []

                  return (
                    <FlatList
                      data={activities}
                      keyExtractor={(activity) =>
                        `${activity.event_name}-${activity.created_at}-${activity?.from_user?.id}-${activity?.to_user?.id}`
                      }
                      renderItem={({ item: activity, index }) => {
                        const date = activity.created_at.toLocaleDateString()
                        const nextDate = activities[index + 1]?.created_at.toLocaleDateString()
                        const shouldShowDatePill = !nextDate || date !== nextDate

                        return (
                          <>
                            <Fade>
                              <TransactionEntry
                                activity={activity}
                                sent={activity?.to_user?.id !== user?.id}
                                otherUserProfile={otherUserProfile}
                                currentUserProfile={currentUserProfile}
                              />
                            </Fade>
                            {shouldShowDatePill ? <DatePill date={date} /> : null}
                          </>
                        )
                      }}
                      onEndReached={fetchNextPage}
                      ListFooterComponent={
                        !isLoadingActivities && isFetchingNextPageActivities ? (
                          <Spinner size="small" color={'$primary'} my={'$4'} />
                        ) : null
                      }
                      inverted={true}
                      showsVerticalScrollIndicator={false}
                    />
                  )
                }
              }
            })()}
          </>
        ) : null}
        {Boolean(otherUserProfile) && user?.id !== otherUserProfile?.id ? (
          <XStack gap="$size.1.5" ai={'center'} mb={'$4'}>
            <SendButton
              identifier={otherUserProfile?.tag ?? otherUserProfile?.sendid ?? ''}
              idType={otherUserProfile?.tag ? 'tag' : 'sendid'}
            />
          </XStack>
        ) : null}
      </YStack>
      <ProfilesDetailsModal />
    </XStack>
  )
}

const TransactionEntry = ({
  activity,
  sent,
  otherUserProfile,
  currentUserProfile,
}: {
  activity: Activity
  sent: boolean
  otherUserProfile?: AvatarProfileProps
  currentUserProfile?: AvatarProfileProps
}) => {
  const { created_at } = activity
  const amount = amountFromActivity(activity)
  const date = new Date(created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

  return (
    <XStack justifyContent={sent ? 'flex-end' : 'flex-start'} testID="activityTest" my={'$2.5'}>
      <YStack gap={'$1'}>
        <YStack bg={'$color1'} p={'$4'} borderRadius={'$4'}>
          <XStack gap={'$3'} alignItems={'center'} flexDirection={sent ? 'row-reverse' : 'row'}>
            <AvatarProfile
              profile={sent ? currentUserProfile : otherUserProfile}
              mx="none"
              size="$5"
            />
            <YStack>
              <XStack gap={'$2'} alignItems={'center'} flexDirection={sent ? 'row-reverse' : 'row'}>
                {!sent && <IconArrowRight size={'$size.0.9'} rotate={'90deg'} color={'$olive'} />}
                <Paragraph size={'$3'} color={'$color8'} theme={sent ? 'red' : 'green'}>
                  You {sent ? 'Sent' : 'Received'}
                </Paragraph>
                {sent && (
                  <IconArrowRight size={'$size.0.9'} rotate={'-90deg'} color={'$red10Dark'} />
                )}
              </XStack>
              <Paragraph size={'$7'}>{amount}</Paragraph>
            </YStack>
          </XStack>
        </YStack>
        <Paragraph
          size={'$2'}
          textAlign={sent ? 'right' : 'left'}
          color={'$color4'}
          $theme-light={{ color: '$silverChalice' }}
        >
          {date}
        </Paragraph>
      </YStack>
    </XStack>
  )
}

const DatePill = ({ date }: { date: string }) => {
  return (
    <Paragraph
      ff={'$mono'}
      textAlign={'center'}
      size={'$4'}
      py={'$size.0.25'}
      bc={'$background'}
      color={'$color10'}
      px={'$size.0.9'}
      br={'$2'}
    >
      {date}
    </Paragraph>
  )
}
