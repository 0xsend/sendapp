import { YStack } from '@my/ui'
import { useConfirmedTags, usePendingTags } from 'app/utils/tags'
import { useEffect, useMemo } from 'react'
import { useRouter } from 'solito/router'
import { CheckoutForm } from './checkout-form'
import { useUser } from 'app/utils/useUser'
import { Platform } from 'react-native'

export const CheckoutScreen = () => {
  const { isLoading } = useUser()
  const confirmedTags = useConfirmedTags()
  const router = useRouter()
  const pendingTagsRaw = usePendingTags()
  const pendingTags = useMemo(() => pendingTagsRaw ?? [], [pendingTagsRaw])

  useEffect(() => {
    if (confirmedTags?.length === 5 || (!isLoading && pendingTags.length === 0)) {
      router.replace('/account/sendtag')
    }
  }, [confirmedTags, router, pendingTags, isLoading])

  return (
    <YStack
      f={Platform.OS === 'web' ? undefined : 1}
      width={'100%'}
      pt={'$3.5'}
      gap="$5"
      jc={'space-between'}
      $gtLg={{
        width: '50%',
        pb: '$3.5',
      }}
    >
      <CheckoutForm />
    </YStack>
  )
}
