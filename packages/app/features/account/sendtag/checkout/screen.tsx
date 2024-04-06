import { Container, Stack } from '@my/ui'
import { useConfirmedTags } from 'app/utils/tags'
import { useEffect } from 'react'
import { useRouter } from 'solito/router'
import { CheckoutForm } from './checkout-form'

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
