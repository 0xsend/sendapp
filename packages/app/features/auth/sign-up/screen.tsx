import { Stack, YStack, useMedia, Theme, isWeb, Anchor, Paragraph, XStack } from '@my/ui'
import { IconSendLogo } from 'app/components/icons'
import { useContext, useEffect, useState } from 'react'
import { SignUpForm } from 'app/features/auth/sign-up/sign-up-form'
import { AuthCarouselContext } from 'app/features/auth/AuthCarouselContext'
import { Carousel } from 'app/features/auth/components/Carousel'
import { useRouter } from 'solito/router'
import { ContinueButton } from '../ContinueButton'
import { SignUpButtons } from '../SignUpButtons'
import { useLink } from 'solito/link'

export const SignUpScreen = () => {
  return (
    <>
      <Theme inverse={true}>
        <IconSendLogo size={'$6'} color={'$background'} />
      </Theme>
      <YStack h="100%" jc="center" ai="center" f={1}>
        <YStack gap="$2">
          <SignUpForm />
          <XStack jc="center" ai="center" mt="$4">
            <Paragraph size="$2" color="$color11">
              Already have an account?{' '}
              <Anchor color="$color12" {...useLink({ href: '/auth/sign-in' })}>
                Sign in
              </Anchor>
            </Paragraph>
          </XStack>
        </YStack>
      </YStack>
    </>
  )
}

const screens = ['screen1', 'screen2', 'screen3', 'form'] as const

const SignUpScreensMobile = () => {
  const [signUpProgress, setSignUpProgress] = useState(0)
  const { setCarouselProgress } = useContext(AuthCarouselContext)
  const router = useRouter()

  useEffect(() => {
    setCarouselProgress(0)
  }, [setCarouselProgress])

  const nextScreen = () => {
    setSignUpProgress((progress) => {
      setCarouselProgress(progress + 1)
      return progress + 1
    })
  }

  const getSignUpButtons = (page: (typeof screens)[number] | undefined) => {
    switch (true) {
      case page === 'screen1' || page === 'screen2':
        return <ContinueButton nextScreen={nextScreen} />
      case page === 'screen3':
        return <SignUpButtons nextScreen={nextScreen} />
      case page === 'form':
        return null
      default:
        return <ContinueButton nextScreen={nextScreen} />
    }
  }

  return (
    <Stack h="100%">
      <Stack>
        {screens[signUpProgress] === 'form' ? (
          <Theme inverse={true}>
            <IconSendLogo size={'$2'} color={'$background'} />
          </Theme>
        ) : (
          <IconSendLogo size={'$2'} color={'$white'} />
        )}
      </Stack>
      <YStack jc={screens[signUpProgress] === 'form' ? 'flex-start' : 'flex-end'} f={1} gap="$2">
        {screens[signUpProgress] === 'form' ? (
          <SignUpForm />
        ) : (
          <>
            <Carousel fullscreen={false} currentKey={screens[signUpProgress]} />
            {getSignUpButtons(screens[signUpProgress])}
          </>
        )}
      </YStack>
    </Stack>
  )
}
