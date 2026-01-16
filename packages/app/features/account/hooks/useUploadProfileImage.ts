import { useCallback, useState } from 'react'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useUser } from 'app/utils/useUser'
import { api } from 'app/utils/api'
import { decode } from 'base64-arraybuffer'
import { generateBlurhash } from 'app/utils/blurhash'
import * as ImagePicker from 'expo-image-picker'

export type ImageType = 'avatar' | 'banner'
export type UploadStatus = 'idle' | 'uploading' | 'processing' | 'complete' | 'error'

export interface UploadResult {
  imageId: string
  blurhash?: string
}

export interface UseUploadProfileImageOptions {
  imageType: ImageType
  aspect?: [number, number]
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export interface UseUploadProfileImageReturn {
  pickAndUpload: () => Promise<void>
  status: UploadStatus
  error: string | null
  isUploading: boolean
  isProcessing: boolean
}

/**
 * Hook for uploading profile images (avatar or banner).
 * Handles image picking, storage upload, blurhash generation, and workflow triggering.
 *
 * @param options Configuration options for the upload
 * @returns Upload state and trigger function
 */
export function useUploadProfileImage({
  imageType,
  aspect,
  onSuccess,
  onError,
}: UseUploadProfileImageOptions): UseUploadProfileImageReturn {
  const { user, updateProfile } = useUser()
  const supabase = useSupabase()
  const uploadImageMutation = api.profile.uploadImage.useMutation()

  const [status, setStatus] = useState<UploadStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const pickAndUpload = useCallback(async () => {
    if (!user) {
      setError('User not authenticated')
      return
    }

    setStatus('idle')
    setError(null)

    try {
      // Pick image from library
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: aspect ?? (imageType === 'avatar' ? [1, 1] : [21, 9]),
        quality: 1,
        base64: true,
      })

      if (pickerResult.canceled) {
        return
      }

      const image = pickerResult.assets[0]
      if (!image?.base64) {
        throw new Error('Failed to get image data')
      }

      setStatus('uploading')

      // Prepare base64 data
      const base64Str = image.base64.includes('base64,')
        ? image.base64.substring(image.base64.indexOf('base64,') + 'base64,'.length)
        : image.base64

      const arrayBuffer = decode(base64Str)
      if (!(arrayBuffer.byteLength > 0)) {
        throw new Error('Invalid image data')
      }

      // Upload to storage
      const storagePath = `${user.id}/${Date.now()}.jpeg`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(storagePath, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: true,
        })

      if (uploadError) {
        throw new Error(uploadError.message)
      }

      // Generate blurhash on client (web) or undefined (native - server will generate)
      const blurhash = await generateBlurhash(base64Str, imageType)

      setStatus('processing')

      // Trigger image processing workflow via tRPC
      await uploadImageMutation.mutateAsync({
        storagePath,
        imageType,
        blurhash,
      })

      // Poll for completion (30s timeout with 2s intervals)
      const pollForCompletion = async () => {
        const maxAttempts = 15
        for (let i = 0; i < maxAttempts; i++) {
          await new Promise((r) => setTimeout(r, 2000))
          await updateProfile()
        }
      }

      // Start polling in background
      pollForCompletion()

      setStatus('complete')
      onSuccess?.()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed'
      setError(errorMessage)
      setStatus('error')
      onError?.(err instanceof Error ? err : new Error(errorMessage))
    }
  }, [user, supabase, imageType, aspect, uploadImageMutation, updateProfile, onSuccess, onError])

  return {
    pickAndUpload,
    status,
    error,
    isUploading: status === 'uploading',
    isProcessing: status === 'processing',
  }
}
