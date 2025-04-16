import { YStack } from '@my/ui'
import { useConfirmedTags, usePendingTags } from 'app/utils/tags'
import { useEffect } from 'react'
import { useRouter } from 'solito/router'
import { CheckoutForm } from './checkout-form'
import { useUser } from 'app/utils/useUser'

export const CheckoutScreen = () => {
  const { isLoadingTags } = useUser()
  const confirmedTags = useConfirmedTags()
  const router = useRouter()
  const pendingTags = usePendingTags() ?? []

  useEffect(() => {
    if (confirmedTags?.length === 5 || (!isLoadingTags && pendingTags.length === 0)) {
      router.replace('/account/sendtag')
    }
  }, [confirmedTags, router, pendingTags, isLoadingTags])

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
      <CheckoutForm />
    </YStack>
  )
}
