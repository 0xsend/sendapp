import { Container, FormWrapper, Paragraph, Stack, YStack } from '@my/ui'

import { useConfirmedTags, usePendingTags } from 'app/utils/tags'

import { useUser } from 'app/utils/useUser'
import React, { useEffect } from 'react'

import { CheckoutForm } from './checkout-form'

export const CheckoutScreen = () => {
  const user = useUser()
  const pendingTags = usePendingTags()
  const confirmedTags = useConfirmedTags()
  const hasPendingTags = pendingTags && pendingTags.length > 0

  // manage the scroll state when new tags are added but ensure the name input is always visible
  useEffect(() => {
    if (hasPendingTags) {
      window?.scrollTo({
        top: document?.body?.scrollHeight - 140,
        behavior: 'smooth',
      })
    }
  }, [hasPendingTags])

  if (confirmedTags?.length === 5) {
    return (
      <YStack h="100%" width="100%">
        <YStack f={1} als={'stretch'} h="100%" width="100%">
          <YStack gap="$2" py="$4" pb="$4" mx="auto" width="100%" maw={600}>
            <FormWrapper.Body>
              <Paragraph>You have already reserved 5 Send Tags.</Paragraph>
              {user.tags?.map((tag) => (
                <YStack key={tag.name} space="$2">
                  <Paragraph fontWeight={'bold'}>{tag.name}</Paragraph>
                </YStack>
              ))}
            </FormWrapper.Body>
          </YStack>
        </YStack>
      </YStack>
    )
  }

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
