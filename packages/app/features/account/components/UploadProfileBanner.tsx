import { SizableText, Spinner, useThemeName, YStack, type YStackProps } from '@my/ui'
import { Camera } from '@tamagui/lucide-icons'
import { IconRefresh } from 'app/components/icons'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useUser } from 'app/utils/useUser'
import { decode } from 'base64-arraybuffer'
import * as ImagePicker from 'expo-image-picker'
import type React from 'react'
import { type PropsWithChildren, type Ref, forwardRef, useImperativeHandle, useState } from 'react'
import { useTranslation } from 'react-i18next'

export interface UploadBannerRefObject {
  pickImage: () => void
}

export const UploadBanner = forwardRef(function UploadBanner(
  { children, ...props }: PropsWithChildren<YStackProps>,
  ref: Ref<UploadBannerRefObject>
) {
  const { user, profile, updateProfile } = useUser()
  const supabase = useSupabase()
  const [errMsg, setErrMsg] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const isDark = useThemeName()?.startsWith('dark')
  const { t } = useTranslation('account')

  useImperativeHandle(ref, () => ({ pickImage }))

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [21, 9], // Banner aspect ratio
      quality: 1,
      base64: true,
    })

    await uploadImage(result)
  }

  const uploadImage = async (pickerResult: ImagePicker.ImagePickerResult) => {
    if (pickerResult.canceled) {
      return
    }
    if (!user) return
    const image = pickerResult.assets[0]
    if (!image) {
      setErrMsg(t('upload.errors.noImage'))
      return
    }

    const base64Image = image.base64

    if (!base64Image) {
      setErrMsg(t('upload.errors.noImage'))
      return
    }

    const base64Str = base64Image.includes('base64,')
      ? base64Image.substring(base64Image.indexOf('base64,') + 'base64,'.length)
      : base64Image
    const res = decode(base64Str)

    if (!(res.byteLength > 0)) {
      setErrMsg(t('upload.errors.bufferNull'))
      // console.error('ArrayBuffer is null')
      return null
    }
    setIsUploading(true)
    const result = await supabase.storage
      .from('avatars')
      .upload(`${user.id}/${Number(new Date())}.jpeg`, res, {
        contentType: 'image/jpeg',
        upsert: true,
      })
    if (result.error) {
      setErrMsg(result.error.message)
      setIsUploading(false)
      return
      // console.log(result.error)
      // throw new Error(result.error.message)
    }

    const publicUrlRes = await supabase.storage
      .from('avatars')
      .getPublicUrl(result.data.path.replace('avatars/', ''))

    const { error: update_error } = await supabase
      .from('profiles')
      .update({ banner_url: publicUrlRes.data.publicUrl }) // Update banner_url
      .eq('id', user.id)
    if (update_error) {
      setErrMsg(update_error.message)
      return
    }
    setIsUploading(false)

    await updateProfile()
  }

  return (
    <YStack gap="$4" {...props}>
      {errMsg ? (
        <SizableText theme="red" color="$color9">
          {errMsg}
        </SizableText>
      ) : (
        <></>
      )}
      <YStack
        position="relative"
        alignSelf="flex-start"
        flexShrink={1}
        onPress={() => pickImage()}
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
                case isUploading:
                  return <Spinner size="large" color={isDark ? '$primary' : '$color12'} />
                case !!profile?.banner_url:
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
