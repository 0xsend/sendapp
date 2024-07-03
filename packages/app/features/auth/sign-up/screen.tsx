import { Stack, YStack, useMedia, Theme, isWeb } from '@my/ui'
import { IconSendLogo } from 'app/components/icons'
import { useContext, useEffect, useState } from 'react'
import { SignUpForm } from 'app/features/auth/sign-up/sign-up-form'
import { AuthCarouselContext } from 'app/features/auth/AuthCarouselContext'
import { Carousel } from 'app/features/auth/components/Carousel'
import { useRouter } from 'solito/router'
import { ContinueButton } from '../ContinueButton'
import { SignUpButtons } from '../SignUpButtons'

export const SignUpScreen = () => {
  const { carouselProgress } = useContext(AuthCarouselContext)
  const media = useMedia()

  if (media.gtMd)
    return (
      <YStack w="100%" h={'100%'} jc="flex-start" pt="$7">
        <YStack jc="flex-end" f={1} gap="$2" $gtMd={{ pb: '$8' }} ml="auto" w="100%" maw={738}>
          <Carousel currentKey={carouselProgress.toString()} fullscreen={false} />
        </YStack>
      </YStack>
    )

  return (
    <YStack w="100%" h={isWeb ? 'calc(100vh - (100vh - 100%))' : '100%'} jc="flex-start" pt="$7">
      <SignUpScreensMobile />
    </YStack>
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
