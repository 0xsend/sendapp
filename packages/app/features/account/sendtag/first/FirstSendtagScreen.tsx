import { useEffect } from 'react'
import { useRouter } from 'solito/router'
import { YStack } from '@my/ui'
import { useUser } from 'app/utils/useUser'
import { FirstSendtagForm } from 'app/features/account/sendtag/first/FirstSendtagForm'
import { Platform } from 'react-native'

export const FirstSendtagScreen = () => {
  const { tags } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (tags && tags.length > 0) {
      router.replace('/account/sendtag')
    }
  }, [tags, router])

  return (
    <YStack
      f={Platform.OS === 'web' ? undefined : 1}
      width={'100%'}
      gap="$5"
      jc={'space-between'}
      pt={'$3.5'}
      $gtLg={{
        width: '50%',
        pb: '$3.5',
      }}
    >
      <FirstSendtagForm />
    </YStack>
  )
}
