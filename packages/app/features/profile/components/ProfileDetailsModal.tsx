import { isWeb, Spinner, YStack } from '@my/ui'
import { ProfileAboutTile } from 'app/features/profile/components/ProfileAboutTile'
import { useRootScreenParams } from 'app/routers/params'
import { useProfileLookup } from 'app/utils/useProfileLookup'
import { useRouter } from 'solito/router'

export const ProfilesDetailsModal = () => {
  const { back } = useRouter()
  const [{ profile: profileParam }] = useRootScreenParams()
  const { data: profile, isLoading } = useProfileLookup('sendid', profileParam || '')

  switch (true) {
    case isLoading:
      return <Spinner size="large" />
    case !profile || profileParam === undefined:
      return null
    default:
      return (
        <YStack
          w={'100%'}
          ai={'center'}
          $gtLg={{
            width: '35%',
            minWidth: 400,
            // @ts-expect-error - web type is confused here
            height: isWeb ? '81vh' : 'auto',
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
            <ProfileAboutTile profile={profile} onClose={() => back()} />
          </YStack>
        </YStack>
      )
  }
}
