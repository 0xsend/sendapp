import { SizableText, Spinner, YStack } from '@my/ui'
import { IconRefresh } from 'app/components/icons'
import { Camera } from '@tamagui/lucide-icons'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useUser } from 'app/utils/useUser'
import { decode } from 'base64-arraybuffer'
import * as ImagePicker from 'expo-image-picker'
import type React from 'react'
import { type Ref, forwardRef, useImperativeHandle, useState } from 'react'

export interface UploadAvatarRefObject {
  pickImage: () => void
}

export const UploadAvatar = forwardRef(function UploadAvatar(
  { children }: { children: React.ReactNode },
  ref: Ref<UploadAvatarRefObject>
) {
  const { user, profile, updateProfile } = useUser()
  const supabase = useSupabase()
  const [errMsg, setErrMsg] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  useImperativeHandle(ref, () => ({ pickImage }))

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
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
      setErrMsg('No image provided.')
      return
    }

    const base64Image = image.base64

    if (!base64Image) {
      setErrMsg('No image provided.')
      return
    }

    const base64Str = base64Image.includes('base64,')
      ? base64Image.substring(base64Image.indexOf('base64,') + 'base64,'.length)
      : base64Image
    const res = decode(base64Str)

    if (!(res.byteLength > 0)) {
      setErrMsg('ArrayBuffer is null')
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
      .update({ avatar_url: publicUrlRes.data.publicUrl })
      .eq('id', user.id)
    if (update_error) {
      setErrMsg(update_error.message)
      return
    }
    setIsUploading(false)

    await updateProfile()
  }

  return (
    <YStack gap={'$4'}>
      <YStack
        position="relative"
        alignSelf="flex-start"
        flexShrink={1}
        onPress={() => pickImage()}
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
              backgroundColor: '$black',
            }}
          />
          <YStack position="absolute" left={0} right={0} top={0} bottom={0} jc="center" ai="center">
            {(() => {
              switch (true) {
                case isUploading:
                  return <Spinner size="small" />
                case !!profile?.avatar_url:
                  return <IconRefresh color="$primary" />
                default:
                  return <Camera color="$primary" size={'$4'} />
              }
            })()}
          </YStack>
        </YStack>
      </YStack>
      {errMsg ? <SizableText theme="red">{errMsg}</SizableText> : <></>}
    </YStack>
  )
})
