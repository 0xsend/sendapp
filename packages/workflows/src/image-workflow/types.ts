export type ProcessingStatus = 'pending' | 'complete' | 'failed'

export interface VariantUrls {
  webp: string
  jpeg: string
}

export interface ImageData {
  version: 1
  imageId: string
  baseUrl: string
  blurhash: string
  processingStatus: ProcessingStatus
  variants: Record<string, VariantUrls>
}

export interface AvatarData extends ImageData {
  variants: {
    xs: VariantUrls
    sm: VariantUrls
    md: VariantUrls
    lg: VariantUrls
    xl: VariantUrls
  }
}

export interface BannerData extends ImageData {
  variants: {
    sm: VariantUrls
    md: VariantUrls
    lg: VariantUrls
  }
}

export type ImageType = 'avatar' | 'banner'
export type ImageFormat = 'webp' | 'jpeg'

export const AVATAR_SIZES = {
  xs: { width: 32, height: 32 },
  sm: { width: 64, height: 64 },
  md: { width: 128, height: 128 },
  lg: { width: 256, height: 256 },
  xl: { width: 1024, height: 1024 },
} as const

export const BANNER_SIZES = {
  sm: { width: 630, height: 270 },
  md: { width: 1050, height: 450 },
  lg: { width: 1680, height: 720 },
} as const

export const FORMATS: readonly ImageFormat[] = ['webp', 'jpeg'] as const
export const QUALITY = 90

export type AvatarSize = keyof typeof AVATAR_SIZES
export type BannerSize = keyof typeof BANNER_SIZES

export interface ProcessImageInput {
  userId: string
  storagePath: string
  imageType: ImageType
  imageId: string
  previousImageId?: string
  blurhash?: string
}

export interface GenerateBlurhashInput {
  sourcePath: string
  imageType: ImageType
}

export interface GenerateBlurhashOutput {
  blurhash: string
}

export interface ProcessVariantInput {
  sourcePath: string
  outputPath: string
  width: number
  height: number
  format: ImageFormat
  quality: number
}

export interface UpdateProfileImageDataInput {
  userId: string
  imageType: ImageType
  imageId: string
  basePath: string
  status: 'complete' | 'failed'
}

export interface UpdateProfileBlurhashInput {
  userId: string
  imageType: ImageType
  imageId: string
  blurhash: string
}

export interface DeleteOldImageInput {
  userId: string
  imageType: ImageType
  imageId: string
}

export interface DeleteOriginalUploadInput {
  storagePath: string
}
