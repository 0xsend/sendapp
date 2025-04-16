import { useConfirmedTags } from 'app/utils/tags'
import { useEffect } from 'react'
import { useRouter } from 'solito/router'
import { AddSendtagsForm } from 'app/features/account/sendtag/add/AddSendtagsForm'
import { YStack } from '@my/ui'

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
      width={'100%'}
      gap="$5"
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
