import { SizableText, Spinner, useThemeName, YStack } from '@my/ui'
import { IconAccount, IconRefresh } from 'app/components/icons'
import { useUser } from 'app/utils/useUser'
import type React from 'react'
import { type Ref, forwardRef, useImperativeHandle } from 'react'
import { useAnalytics } from 'app/provider/analytics'
import { useUploadProfileImage } from '../../hooks/useUploadProfileImage'

export interface UploadAvatarRefObject {
  pickImage: () => void
}

export const UploadAvatar = forwardRef(function UploadAvatar(
  { children }: { children: React.ReactNode },
  ref: Ref<UploadAvatarRefObject>
) {
  const { profile } = useUser()
  const analytics = useAnalytics()
  const isDark = useThemeName()?.startsWith('dark')

  const { pickAndUpload, error, isUploading, isProcessing } = useUploadProfileImage({
    imageType: 'avatar',
    aspect: [1, 1],
    onSuccess: () => {
      analytics.capture({
        name: 'profile_updated',
        properties: {
          fields_updated: ['avatar_data'],
        },
      })
    },
  })

  useImperativeHandle(ref, () => ({ pickImage: pickAndUpload }))

  const avatarData = profile?.avatar_data as { processingStatus?: string } | null
  const hasAvatar = !!profile?.avatar_url || avatarData?.processingStatus === 'complete'
  const isPending = isUploading || isProcessing || avatarData?.processingStatus === 'pending'

  return (
    <YStack gap={'$4'}>
      <YStack
        position="relative"
        alignSelf="flex-start"
        flexShrink={1}
        onPress={() => pickAndUpload()}
        cursor="pointer"
      >
        {children}
        <YStack
          position="absolute"
          left={0}
          right={0}
          top={0}
          bottom={0}
          jc="center"
          ai="center"
          zIndex={100}
        >
          <YStack
            backgroundColor="$color0"
            opacity={0.66}
            borderRadius={'$3'}
            position="absolute"
            left={0}
            right={0}
            top={0}
            bottom={0}
            $theme-light={{
              backgroundColor: '$color2',
            }}
          />
          <YStack position="absolute" left={0} right={0} top={0} bottom={0} jc="center" ai="center">
            {(() => {
              switch (true) {
                case isPending:
                  return <Spinner size="small" color={isDark ? '$primary' : '$color12'} />
                case hasAvatar:
                  return <IconRefresh color={isDark ? '$primary' : '$color12'} size="$1.5" />
                default:
                  return <IconAccount color={isDark ? '$primary' : '$color12'} size={'$4'} />
              }
            })()}
          </YStack>
        </YStack>
      </YStack>
      {error ? <SizableText theme="red">{error}</SizableText> : <></>}
    </YStack>
  )
})
