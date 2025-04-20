import { YStack } from '@my/ui'
import { useQueryClient } from '@tanstack/react-query'
import { AuthCarouselContext } from 'app/features/auth/AuthCarouselContext'
import { HomeScreen } from 'app/features/home/screen'
import { SplashScreen } from 'app/features/splash/screen'
import type { GetPlaiceholderImage } from 'app/utils/getPlaiceholderImage'
import { useSendAccount } from 'app/utils/send-accounts/useSendAccounts'
import { useUser } from 'app/utils/useUser'
import { Stack } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'

// Hardcoded carousel images for mobile - using type assertion to avoid complexities with GetPlaiceholderImage type
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
    pixels: [
      [
        {
          r: 136,
          g: 120,
          b: 61,
        },
        {
          r: 121,
          g: 163,
          b: 146,
        },
        {
          r: 77,
          g: 88,
          b: 94,
        },
        {
          r: 82,
          g: 96,
          b: 95,
        },
      ],
      [
        {
          r: 105,
          g: 109,
          b: 95,
        },
        {
          r: 103,
          g: 136,
          b: 144,
        },
        {
          r: 79,
          g: 59,
          b: 45,
        },
        {
          r: 92,
          g: 89,
          b: 78,
        },
      ],
      [
        {
          r: 81,
          g: 71,
          b: 69,
        },
        {
          r: 96,
          g: 70,
          b: 60,
        },
        {
          r: 121,
          g: 74,
          b: 27,
        },
        {
          r: 96,
          g: 64,
          b: 42,
        },
      ],
    ],
    svg: [
      'svg',
      {
        xmlns: 'http://www.w3.org/2000/svg',
        width: '100%',
        height: '100%',
        shapeRendering: 'crispEdges',
        preserveAspectRatio: 'none',
        viewBox: '0 0 4 3',
        style: {
          position: 'absolute',
          top: '50%',
          left: '50%',
          transformOrigin: 'top left',
          transform: 'translate(-50%, -50%)',
          right: 0,
          bottom: 0,
        },
      },
      [
        [
          'rect',
          {
            fill: 'rgb(136,120,61)',
            // @ts-expect-error - still works
            'fill-opacity': 1,
            width: 1,
            height: 1,
            x: 0,
            y: 0,
          },
        ],
        [
          'rect',
          {
            fill: 'rgb(121,163,146)',
            // @ts-expect-error - still works
            'fill-opacity': 1,
            width: 1,
            height: 1,
            x: 1,
            y: 0,
          },
        ],
        [
          'rect',
          {
            fill: 'rgb(77,88,94)',
            // @ts-expect-error - still works
            'fill-opacity': 1,
            width: 1,
            height: 1,
            x: 2,
            y: 0,
          },
        ],
        [
          'rect',
          {
            fill: 'rgb(82,96,95)',
            // @ts-expect-error - still works
            'fill-opacity': 1,
            width: 1,
            height: 1,
            x: 3,
            y: 0,
          },
        ],
        [
          'rect',
          {
            fill: 'rgb(105,109,95)',
            // @ts-expect-error - still works
            'fill-opacity': 1,
            width: 1,
            height: 1,
            x: 0,
            y: 1,
          },
        ],
        [
          'rect',
          {
            fill: 'rgb(103,136,144)',
            // @ts-expect-error - still works
            'fill-opacity': 1,
            width: 1,
            height: 1,
            x: 1,
            y: 1,
          },
        ],
        [
          'rect',
          {
            fill: 'rgb(79,59,45)',
            // @ts-expect-error - still works
            'fill-opacity': 1,
            width: 1,
            height: 1,
            x: 2,
            y: 1,
          },
        ],
        [
          'rect',
          {
            fill: 'rgb(92,89,78)',
            // @ts-expect-error - still works
            'fill-opacity': 1,
            width: 1,
            height: 1,
            x: 3,
            y: 1,
          },
        ],
        [
          'rect',
          {
            fill: 'rgb(81,71,69)',
            // @ts-expect-error - still works
            'fill-opacity': 1,
            width: 1,
            height: 1,
            x: 0,
            y: 2,
          },
        ],
        [
          'rect',
          {
            fill: 'rgb(96,70,60)',
            // @ts-expect-error - still works
            'fill-opacity': 1,
            width: 1,
            height: 1,
            x: 1,
            y: 2,
          },
        ],
        [
          'rect',
          {
            fill: 'rgb(121,74,27)',
            // @ts-expect-error - still works
            'fill-opacity': 1,
            width: 1,
            height: 1,
            x: 2,
            y: 2,
          },
        ],
        [
          'rect',
          {
            fill: 'rgb(96,64,42)',
            // @ts-expect-error - still works
            'fill-opacity': 1,
            width: 1,
            height: 1,
            x: 3,
            y: 2,
          },
        ],
      ],
    ],
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
    pixels: [
      [
        {
          r: 104,
          g: 149,
          b: 126,
        },
        {
          r: 0,
          g: 145,
          b: 115,
        },
        {
          r: 133,
          g: 92,
          b: 59,
        },
        {
          r: 98,
          g: 106,
          b: 87,
        },
      ],
      [
        {
          r: 66,
          g: 110,
          b: 73,
        },
        {
          r: 0,
          g: 153,
          b: 62,
        },
        {
          r: 14,
          g: 83,
          b: 38,
        },
        {
          r: 50,
          g: 72,
          b: 57,
        },
      ],
      [
        {
          r: 0,
          g: 101,
          b: 50,
        },
        {
          r: 0,
          g: 164,
          b: 42,
        },
        {
          r: 0,
          g: 159,
          b: 24,
        },
        {
          r: 0,
          g: 75,
          b: 32,
        },
      ],
    ],
    svg: [
      'svg',
      {
        xmlns: 'http://www.w3.org/2000/svg',
        width: '100%',
        height: '100%',
        shapeRendering: 'crispEdges',
        preserveAspectRatio: 'none',
        viewBox: '0 0 4 3',
        style: {
          position: 'absolute',
          top: '50%',
          left: '50%',
          transformOrigin: 'top left',
          transform: 'translate(-50%, -50%)',
          right: 0,
          bottom: 0,
        },
      },
      [
        [
          'rect',
          {
            fill: 'rgb(104,149,126)',
            // @ts-expect-error - still works
            'fill-opacity': 1,
            width: 1,
            height: 1,
            x: 0,
            y: 0,
          },
        ],
        [
          'rect',
          {
            fill: 'rgb(0,145,115)',
            // @ts-expect-error - still works
            'fill-opacity': 1,
            width: 1,
            height: 1,
            x: 1,
            y: 0,
          },
        ],
        [
          'rect',
          {
            fill: 'rgb(133,92,59)',
            // @ts-expect-error - still works
            'fill-opacity': 1,
            width: 1,
            height: 1,
            x: 2,
            y: 0,
          },
        ],
        [
          'rect',
          {
            fill: 'rgb(98,106,87)',
            // @ts-expect-error - still works
            'fill-opacity': 1,
            width: 1,
            height: 1,
            x: 3,
            y: 0,
          },
        ],
        [
          'rect',
          {
            fill: 'rgb(66,110,73)',
            // @ts-expect-error - still works
            'fill-opacity': 1,
            width: 1,
            height: 1,
            x: 0,
            y: 1,
          },
        ],
        [
          'rect',
          {
            fill: 'rgb(0,153,62)',
            // @ts-expect-error - still works
            'fill-opacity': 1,
            width: 1,
            height: 1,
            x: 1,
            y: 1,
          },
        ],
        [
          'rect',
          {
            fill: 'rgb(14,83,38)',
            // @ts-expect-error - still works
            'fill-opacity': 1,
            width: 1,
            height: 1,
            x: 2,
            y: 1,
          },
        ],
        [
          'rect',
          {
            fill: 'rgb(50,72,57)',
            // @ts-expect-error - still works
            'fill-opacity': 1,
            width: 1,
            height: 1,
            x: 3,
            y: 1,
          },
        ],
        [
          'rect',
          {
            fill: 'rgb(0,101,50)',
            // @ts-expect-error - still works
            'fill-opacity': 1,
            width: 1,
            height: 1,
            x: 0,
            y: 2,
          },
        ],
        [
          'rect',
          {
            fill: 'rgb(0,164,42)',
            // @ts-expect-error - still works
            'fill-opacity': 1,
            width: 1,
            height: 1,
            x: 1,
            y: 2,
          },
        ],
        [
          'rect',
          {
            fill: 'rgb(0,159,24)',
            // @ts-expect-error - still works
            'fill-opacity': 1,
            width: 1,
            height: 1,
            x: 2,
            y: 2,
          },
        ],
        [
          'rect',
          {
            fill: 'rgb(0,75,32)',
            // @ts-expect-error - still works
            'fill-opacity': 1,
            width: 1,
            height: 1,
            x: 3,
            y: 2,
          },
        ],
      ],
    ],
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
    pixels: [
      [
        {
          r: 85,
          g: 116,
          b: 122,
        },
        {
          r: 130,
          g: 156,
          b: 155,
        },
        {
          r: 104,
          g: 115,
          b: 117,
        },
        {
          r: 95,
          g: 109,
          b: 109,
        },
      ],
      [
        {
          r: 91,
          g: 113,
          b: 118,
        },
        {
          r: 106,
          g: 137,
          b: 140,
        },
        {
          r: 122,
          g: 120,
          b: 115,
        },
        {
          r: 43,
          g: 47,
          b: 49,
        },
      ],
      [
        {
          r: 64,
          g: 76,
          b: 77,
        },
        {
          r: 57,
          g: 75,
          b: 80,
        },
        {
          r: 47,
          g: 48,
          b: 46,
        },
        {
          r: 21,
          g: 23,
          b: 26,
        },
      ],
    ],
    svg: [
      'svg',
      {
        xmlns: 'http://www.w3.org/2000/svg',
        width: '100%',
        height: '100%',
        shapeRendering: 'crispEdges',
        preserveAspectRatio: 'none',
        viewBox: '0 0 4 3',
        style: {
          position: 'absolute',
          top: '50%',
          left: '50%',
          transformOrigin: 'top left',
          transform: 'translate(-50%, -50%)',
          right: 0,
          bottom: 0,
        },
      },
      [
        [
          'rect',
          {
            fill: 'rgb(85,116,122)',
            // @ts-expect-error - still works
            'fill-opacity': 1,
            width: 1,
            height: 1,
            x: 0,
            y: 0,
          },
        ],
        [
          'rect',
          {
            fill: 'rgb(130,156,155)',
            // @ts-expect-error - still works
            'fill-opacity': 1,
            width: 1,
            height: 1,
            x: 1,
            y: 0,
          },
        ],
        [
          'rect',
          {
            fill: 'rgb(104,115,117)',
            // @ts-expect-error - still works
            'fill-opacity': 1,
            width: 1,
            height: 1,
            x: 2,
            y: 0,
          },
        ],
        [
          'rect',
          {
            fill: 'rgb(95,109,109)',
            // @ts-expect-error - still works
            'fill-opacity': 1,
            width: 1,
            height: 1,
            x: 3,
            y: 0,
          },
        ],
        [
          'rect',
          {
            fill: 'rgb(91,113,118)',
            // @ts-expect-error - still works
            'fill-opacity': 1,
            width: 1,
            height: 1,
            x: 0,
            y: 1,
          },
        ],
        [
          'rect',
          {
            fill: 'rgb(106,137,140)',
            // @ts-expect-error - still works
            'fill-opacity': 1,
            width: 1,
            height: 1,
            x: 1,
            y: 1,
          },
        ],
        [
          'rect',
          {
            fill: 'rgb(122,120,115)',
            // @ts-expect-error - still works
            'fill-opacity': 1,
            width: 1,
            height: 1,
            x: 2,
            y: 1,
          },
        ],
        [
          'rect',
          {
            fill: 'rgb(43,47,49)',
            // @ts-expect-error - still works
            'fill-opacity': 1,
            width: 1,
            height: 1,
            x: 3,
            y: 1,
          },
        ],
        [
          'rect',
          {
            fill: 'rgb(64,76,77)',
            // @ts-expect-error - still works
            'fill-opacity': 1,
            width: 1,
            height: 1,
            x: 0,
            y: 2,
          },
        ],
        [
          'rect',
          {
            fill: 'rgb(57,75,80)',
            // @ts-expect-error - still works
            'fill-opacity': 1,
            width: 1,
            height: 1,
            x: 1,
            y: 2,
          },
        ],
        [
          'rect',
          {
            fill: 'rgb(47,48,46)',
            // @ts-expect-error - still works
            'fill-opacity': 1,
            width: 1,
            height: 1,
            x: 2,
            y: 2,
          },
        ],
        [
          'rect',
          {
            fill: 'rgb(21,23,26)',
            // @ts-expect-error - still works
            'fill-opacity': 1,
            width: 1,
            height: 1,
            x: 3,
            y: 2,
          },
        ],
      ],
    ],
    img: {
      src: 'https://ghassets.send.app/app_images/auth_image_1.jpg',
      height: 1152,
      width: 1440,
    },
  },
] satisfies GetPlaiceholderImage[]

export default function Screen() {
  const { session } = useUser()
  const [carouselImages, setCarouselImages] = useState<GetPlaiceholderImage[]>([])
  const [carouselProgress, setCarouselProgress] = useState(0)
  const queryClient = useQueryClient()

  const cancelAndRemoveAccountsQueries = useCallback(async () => {
    if (!session) {
      const options = { queryKey: [useSendAccount.queryKey] }
      await queryClient.cancelQueries(options)
      queryClient.removeQueries(options)
    }
  }, [session, queryClient])

  useEffect(() => {
    // @ts-expect-error - still works
    if (carouselImages.length === 0) setCarouselImages(mobileCarouselImages)
  }, [carouselImages])

  useEffect(() => {
    void cancelAndRemoveAccountsQueries()
  }, [cancelAndRemoveAccountsQueries])

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Home',
          headerShown: false,
        }}
      />

      {session ? (
        <YStack f={1}>
          <HomeScreen />
        </YStack>
      ) : (
        <AuthCarouselContext.Provider
          value={{
            carouselImages,
            setCarouselImages,
            carouselProgress,
            setCarouselProgress,
          }}
        >
          <SplashScreen />
        </AuthCarouselContext.Provider>
      )}
    </>
  )
}
