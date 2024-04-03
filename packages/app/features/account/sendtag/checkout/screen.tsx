import { Container, FormWrapper, Paragraph, Stack, XStack, YStack } from '@my/ui'

import { useConfirmedTags, usePendingTags } from 'app/utils/tags'

import { useUser } from 'app/utils/useUser'
import { useEffect } from 'react'

import { CheckoutForm } from './checkout-form'
import { useRouter } from 'solito/router'

export const CheckoutScreen = () => {
  const confirmedTags = useConfirmedTags()
  const router = useRouter()

  useEffect(() => {
    if (confirmedTags?.length === 5) {
      router.replace('/account/sendtag')
    }
  }, [confirmedTags, router])

  return (
    <Container>
      <Stack
        f={1}
        maw={481}
        $lg={{ gap: '$2', ai: 'center' }}
        $theme-dark={{ btc: '$gray7Dark' }}
        $theme-light={{ btc: '$gray4Light' }}
      >
        <CheckoutForm />
      </Stack>
    </Container>
  )
}
