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
    console.log('Checkout Screen State:', {
      isLoadingTags,
      confirmedTagsLength: confirmedTags?.length,
      pendingTagsLength: pendingTags.length,
      pathname: window.location.pathname,
    })

    // Only redirect if:
    // 1. We have max confirmed tags OR
    // 2. We have pending tags but the form was submitted (handled by checkout form)
    if (confirmedTags?.length === 5) {
      console.log('Redirecting back - max tags reached')
      router.replace('/account/sendtag')
    }
  }, [confirmedTags, router, pendingTags, isLoadingTags])

  // Show loading state while checking tags
  if (isLoadingTags) {
    return (
      <YStack width={'100%'} gap="$5" pb={'$3.5'} $gtLg={{ width: '50%' }}>
        <div>Loading tags...</div>
      </YStack>
    )
  }

  return (
    <YStack
      width={'100%'}
      gap="$5"
      pb={'$3.5'}
      $gtLg={{
        width: '50%',
      }}
    >
      <CheckoutForm />
    </YStack>
  )
}
