import {
  Button,
  Fade,
  isWeb,
  Paragraph,
  Spinner,
  Stack,
  Text,
  useMedia,
  XStack,
  YStack,
} from '@my/ui'
import { useProfileLookup } from 'app/utils/useProfileLookup'
import { useUser } from 'app/utils/useUser'
import { AvatarProfile, type AvatarProfileProps } from './AvatarProfile'
import { useInterUserActivityFeed } from './utils/useInterUserActivityFeed'
import type { Activity } from 'app/utils/zod/activity'
import { amountFromActivity } from 'app/utils/activity'
import { Fragment, useState } from 'react'
import { useProfileScreenParams } from 'app/routers/params'
import { IconArrowRight } from 'app/components/icons'
import { SendButton } from './ProfileButtons'
import { ProfileHeader } from 'app/features/profile/components/ProfileHeader'
import { ProfileAboutTile } from 'app/features/profile/components/ProfileAboutTile'

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
  const [isProfileInfoVisible, setIsProfileInfoVisible] = useState<boolean>(false)

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

  const toggleIsProfileInfoVisible = () => {
    setIsProfileInfoVisible((prevState) => !prevState)
  }

  return (
    <XStack w={'100%'} gap={'$4'}>
      <YStack
        f={1}
        gap={'$2'}
        display={isProfileInfoVisible ? 'none' : 'flex'}
        $gtLg={{
          display: 'flex',
          maxWidth: '50%',
          overflow: 'hidden',
          height: isWeb ? '80vh' : 'auto',
        }}
      >
        <YStack
          f={1}
          gap="$6"
          flexGrow={1}
          className={'hide-scroll'}
          // @ts-expect-error typescript is complaining about overflowY not available and advising overflow. Overflow will work differently than overflowY here, overflowY is working fine
          $gtLg={{ overflowY: 'scroll' }}
        >
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
            <YStack
              h={isWeb ? (media.shorter ? '83vh' : '88vh') : media.shorter ? '83%' : '88%'}
              $gtMd={{ height: 'auto' }}
            >
              <Stack py="$size.3.5" pt={'$0'} $gtLg={{ h: 'auto', pt: '$0' }}>
                <YStack width="100%" gap="$2">
                  <ProfileHeader
                    onPressOut={toggleIsProfileInfoVisible}
                    profile={otherUserProfile}
                  />
                  <YStack gap={'$size.1'}>
                    {(() => {
                      switch (true) {
                        case isLoadingActivities:
                          return <Spinner size="small" color={'$primary'} mt={'$8'} />
                        case activitiesError !== null:
                          return (
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
                              const date = activity.created_at.toLocaleDateString()
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
                                      otherUserProfile={otherUserProfile}
                                      currentUserProfile={currentUserProfile}
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
                          {isFetchingNextPageActivities && (
                            <Spinner size="small" color={'$primary'} mb={'$4'} />
                          )}
                          {hasNextPage && (
                            <Button
                              onPress={() => {
                                fetchNextPage()
                              }}
                              disabled={isFetchingNextPageActivities || isFetchingActivities}
                              color="$color11"
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
        {Boolean(otherUserProfile) && user?.id !== otherUserProfile?.id ? (
          <XStack gap="$size.1.5" ai={'center'} display="none" $gtLg={{ display: 'flex' }}>
            <SendButton
              identifier={otherUserProfile?.tag ?? otherUserProfile?.sendid ?? ''}
              idType={otherUserProfile?.tag ? 'tag' : 'sendid'}
            />
          </XStack>
        ) : null}
      </YStack>
      {isProfileInfoVisible && (
        <YStack
          w={'100%'}
          ai={'center'}
          $gtLg={{
            width: '35%',
            minWidth: 400,
            height: isWeb ? '81vh' : 'auto',
            // @ts-expect-error typescript is complaining about overflowY not available and advising overflow. Overflow will work differently than overflowY here, overflowY is working fine
            overflowY: 'scroll',
          }}
          className={'hide-scroll'}
        >
          <YStack
            w={'100%'}
            maxWidth={500}
            pb={'$10'}
            $gtLg={{
              pb: 0,
            }}
          >
            <ProfileAboutTile
              otherUserProfile={otherUserProfile}
              onClose={toggleIsProfileInfoVisible}
            />
          </YStack>
        </YStack>
      )}
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
    <XStack justifyContent={sent ? 'flex-end' : 'flex-start'} testID="activityTest">
      <YStack gap={'$2'}>
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
        <Paragraph size={'$2'} textAlign={sent ? 'right' : 'left'} color={'$color4'}>
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
