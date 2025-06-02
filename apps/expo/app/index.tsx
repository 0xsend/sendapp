import { useUser } from 'app/utils/useUser'
import { Redirect } from 'expo-router'
import { Container, YStack } from '@my/ui'
import { SplashScreen } from 'app/features/splash/screen'
import { AuthCarouselContext } from 'app/features/auth/AuthCarouselContext'
import { useState } from 'react'
import type { GetPlaiceholderImage } from 'app/utils/getPlaiceholderImage'

// Hardcoded carousel images for mobile
const mobileCarouselImages = [
  {
    color: {
      r: 8,
      g: 8,
      b: 8,
      hex: '#080808',
    },
    css: {
      backgroundImage:
        'linear-gradient(90deg, rgb(136,120,61) 25%,rgb(121,163,146) 25% 50%,rgb(77,88,94) 50% 75%,rgb(82,96,95) 75% 100%),linear-gradient(90deg, rgb(105,109,95) 25%,rgb(103,136,144) 25% 50%,rgb(79,59,45) 50% 75%,rgb(92,89,78) 75% 100%),linear-gradient(90deg, rgb(81,71,69) 25%,rgb(96,70,60) 25% 50%,rgb(121,74,27) 50% 75%,rgb(96,64,42) 75% 100%)',
      backgroundPosition: '0 0 ,0 50%,0 100%',
      backgroundSize: '100% 33.333333333333336%',
      backgroundRepeat: 'no-repeat',
    },
    base64:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAADCAIAAAA7ljmRAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAMElEQVR4nGNYPzfh5v/PVi5enmFhDOXVuXP3H5dmYPDxtGPQVJS3UpaKN2ExEmcAADiuDGUiluR6AAAAAElFTkSuQmCC',
    img: {
      src: 'https://ghassets.send.app/app_images/auth_image_3.jpg',
      height: 1152,
      width: 1440,
    },
  },
  {
    color: {
      r: 8,
      g: 8,
      b: 8,
      hex: '#080808',
    },
    css: {
      backgroundImage:
        'linear-gradient(90deg, rgb(104,149,126) 25%,rgb(0,145,115) 25% 50%,rgb(133,92,59) 50% 75%,rgb(98,106,87) 75% 100%),linear-gradient(90deg, rgb(66,110,73) 25%,rgb(0,153,62) 25% 50%,rgb(14,83,38) 50% 75%,rgb(50,72,57) 75% 100%),linear-gradient(90deg, rgb(0,101,50) 25%,rgb(0,164,42) 25% 50%,rgb(0,159,24) 50% 75%,rgb(0,75,32) 75% 100%)',
      backgroundPosition: '0 0 ,0 50%,0 100%',
      backgroundSize: '100% 33.333333333333336%',
      backgroundRepeat: 'no-repeat',
    },
    base64:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAADCAIAAAA7ljmRAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAMElEQVR4nGO48P954aMD03K8yutzGAJqw+q+TWZQY2AQZWBgCFOd9X9a3/96BlEGAGSjD6iQjVIFAAAAAElFTkSuQmCC',
    img: {
      src: 'https://ghassets.send.app/app_images/auth_image_2.jpg',
      height: 1152,
      width: 1440,
    },
  },
  {
    color: {
      r: 8,
      g: 8,
      b: 24,
      hex: '#080818',
    },
    css: {
      backgroundImage:
        'linear-gradient(90deg, rgb(85,116,122) 25%,rgb(130,156,155) 25% 50%,rgb(104,115,117) 50% 75%,rgb(95,109,109) 75% 100%),linear-gradient(90deg, rgb(91,113,118) 25%,rgb(106,137,140) 25% 50%,rgb(122,120,115) 50% 75%,rgb(43,47,49) 75% 100%),linear-gradient(90deg, rgb(64,76,77) 25%,rgb(57,75,80) 25% 50%,rgb(47,48,46) 50% 75%,rgb(21,23,26) 75% 100%)',
      backgroundPosition: '0 0 ,0 50%,0 100%',
      backgroundSize: '100% 33.333333333333336%',
      backgroundRepeat: 'no-repeat',
    },
    base64:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAADCAIAAAA7ljmRAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAMklEQVR4nAEnANj/AJO0uub//6i0tpmoqACXr7S73N/CwLsxNTcAXWlqVGdsNjc1AQUKz7ATNB5aY3kAAAAASUVORK5CYII=',
    img: {
      src: 'https://ghassets.send.app/app_images/auth_image_1.jpg',
      height: 1152,
      width: 1440,
    },
  },
] as unknown as GetPlaiceholderImage[]

export default function Index() {
  const { session } = useUser()
  const [carouselImages, setCarouselImages] = useState<GetPlaiceholderImage[]>(mobileCarouselImages)
  const [carouselProgress, setCarouselProgress] = useState(0)

  // If user is logged in, redirect to the home screen inside the tabs layout
  if (session) {
    return <Redirect href="/(tabs)/" />
  }

  // If user is not logged in, show the splash screen
  return (
    <AuthCarouselContext.Provider
      value={{
        carouselImages,
        setCarouselImages,
        carouselProgress,
        setCarouselProgress,
      }}
    >
      <Container
        safeAreaProps={{
          edges: ['left', 'right', 'bottom'],
          style: { flex: 1, backgroundColor: 'black' },
        }}
        flex={1}
        backgroundColor="black"
        px="$0"
      >
        <YStack flex={1} jc="center" ai="center" f={1} backgroundColor="black">
          <SplashScreen />
        </YStack>
      </Container>
    </AuthCarouselContext.Provider>
  )
}
