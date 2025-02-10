import { isWeb, YStack } from '@my/ui'
import { ProfileAboutTile } from 'app/features/profile/components/ProfileAboutTile'
import { useRootScreenParams } from 'app/routers/params'
import { useProfileLookup } from 'app/utils/useProfileLookup'
import { useRouter } from 'solito/router'

export const ProfilesDetailsModal = () => {
  const { back } = useRouter()
  const [{ profile: profileParam }] = useRootScreenParams()
  const { data: profile } = useProfileLookup('sendid', profileParam || '')

  if (!profile || profileParam === undefined) {
    return null
  }

  return (
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
        <ProfileAboutTile profile={profile} onClose={() => back()} />
      </YStack>
    </YStack>
  )
}
