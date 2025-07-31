import { useConfirmedTags } from 'app/utils/tags'
import { useEffect } from 'react'
import { useRouter } from 'solito/router'
import { AddSendtagsForm } from 'app/features/account/sendtag/add/AddSendtagsForm'
import { YStack } from '@my/ui'
import { Platform } from 'react-native'

export const AddSendtagsScreen = () => {
  const confirmedTags = useConfirmedTags()
  const router = useRouter()

  useEffect(() => {
    if (confirmedTags?.length === 5) {
      router.replace('/account/sendtag')
    }
  }, [confirmedTags, router])

  return (
    <YStack
      f={Platform.OS === 'web' ? undefined : 1}
      width={'100%'}
      gap="$5"
      pt={'$3.5'}
      jc={'space-between'}
      $gtLg={{
        width: '50%',
        pb: '$3.5',
      }}
    >
      <AddSendtagsForm />
    </YStack>
  )
}
