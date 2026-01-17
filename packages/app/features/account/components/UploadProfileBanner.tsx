import { SizableText, Spinner, useThemeName, YStack, type YStackProps } from '@my/ui'
import { Camera } from '@tamagui/lucide-icons'
import { IconRefresh } from 'app/components/icons'
import { useUser } from 'app/utils/useUser'
import type React from 'react'
import { type PropsWithChildren, type Ref, forwardRef, useImperativeHandle } from 'react'
import { useAnalytics } from 'app/provider/analytics'
import { useUploadProfileImage } from '../hooks/useUploadProfileImage'

export interface UploadBannerRefObject {
  pickImage: () => void
}

export const UploadBanner = forwardRef(function UploadBanner(
  { children, ...props }: PropsWithChildren<YStackProps>,
  ref: Ref<UploadBannerRefObject>
) {
  const { profile } = useUser()
  const analytics = useAnalytics()
  const isDark = useThemeName()?.startsWith('dark')

  const { pickAndUpload, error, isUploading, isProcessing } = useUploadProfileImage({
    imageType: 'banner',
    aspect: [21, 9],
    onSuccess: () => {
      analytics.capture({
        name: 'profile_updated',
        properties: {
          fields_updated: ['banner_data'],
        },
      })
    },
  })

  useImperativeHandle(ref, () => ({ pickImage: pickAndUpload }))

  const bannerData = profile?.banner_data as { processingStatus?: string } | null
  const hasBanner = !!profile?.banner_url || bannerData?.processingStatus === 'complete'
  const isPending = isUploading || isProcessing || bannerData?.processingStatus === 'pending'

  return (
    <YStack gap="$4" {...props}>
      {error ? (
        <SizableText theme="red" color="$color9">
          {error}
        </SizableText>
      ) : (
        <></>
      )}
      <YStack
        position="relative"
        alignSelf="flex-start"
        flexShrink={1}
        onPress={() => pickAndUpload()}
        cursor="pointer"
        w="100%"
      >
        {children}
        <YStack position="absolute" left={0} right={0} top={0} bottom={0} jc="center" ai="center">
          <YStack
            backgroundColor="$black"
            opacity={0.76}
            borderRadius={'$3'}
            position="absolute"
            left={0}
            right={0}
            top={0}
            bottom={0}
            $theme-light={{
              backgroundColor: '$color9',
            }}
          />
          <YStack position="absolute" left={0} right={0} top={0} bottom={0} jc="center" ai="center">
            {(() => {
              switch (true) {
                case isPending:
                  return <Spinner size="large" color={isDark ? '$primary' : '$color12'} />
                case hasBanner:
                  return <IconRefresh color={isDark ? '$primary' : '$color12'} />
                default:
                  return <Camera color={isDark ? '$primary' : '$color12'} size={'$4'} />
              }
            })()}
          </YStack>
        </YStack>
      </YStack>
    </YStack>
  )
})
