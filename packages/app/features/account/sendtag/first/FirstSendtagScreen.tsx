import { useEffect } from 'react'
import { useRouter } from 'solito/router'
import { YStack } from '@my/ui'
import { useUser } from 'app/utils/useUser'
import { FirstSendtagForm } from 'app/features/account/sendtag/first/FirstSendtagForm'

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
      width={'100%'}
      gap="$5"
      jc={'space-between'}
      $gtLg={{
        width: '50%',
        pb: '$3.5',
      }}
    >
      <FirstSendtagForm />
    </YStack>
  )
}
