# Image Optimization Specification

## Overview

This specification defines a scalable image handling system for user avatars and profile banners. The system generates multiple compressed sizes asynchronously via Temporal workflows and serves optimized formats based on platform requirements.

## Problem Statement

Current implementation:
- Uploads original images without processing
- No size variants (same image served to all contexts)
- No format optimization for web vs mobile
- Cache headers rely on Supabase defaults
- Large images cause slow loads and unnecessary bandwidth

## Goals

1. Generate multiple size variants asynchronously at upload time
2. Serve platform-optimized formats (WebP primary, JPEG fallback)
3. Implement persistent disk caching with appropriate headers
4. Reduce bandwidth and improve load times
5. Provide immediate visual feedback via blurhash placeholders

## Image Size Variants

### Avatar Sizes

| Variant | Dimensions | Use Cases |
|---------|------------|-----------|
| `xs` | 32x32 | Inline mentions, small lists |
| `sm` | 64x64 | Activity feed, contact lists, search results |
| `md` | 128x128 | Profile cards, send confirmation |
| `lg` | 256x256 | Profile header, full profile view |
| `xl` | 1024x1024 | Maximum stored size, source for future variants |

### Banner Sizes

| Variant | Dimensions | Aspect | Use Cases |
|---------|------------|--------|-----------|
| `sm` | 630x270 | 21:9 | Mobile profile header |
| `md` | 1050x450 | 21:9 | Tablet/desktop profile header |
| `lg` | 1680x720 | 21:9 | Large screens, 2x retina |

### Format Specifications

| Platform | Primary Format | Fallback | Quality |
|----------|---------------|----------|---------|
| Web | WebP | JPEG | 90% (lossy) |
| iOS | WebP | JPEG | 90% (lossy) |
| Android | WebP | JPEG | 90% (lossy) |

Note: HEIC was considered but dropped for simplicity since iOS 14+ has native WebP support.

## Storage Structure

### Current Structure
```
avatars/
  {userId}/
    {timestamp}.jpeg
```

### Proposed Structure
```
avatars/
  {userId}/
    avatar/
      {imageId}/
        xs.webp                 # 32x32 WebP
        xs.jpeg                 # 32x32 JPEG fallback
        sm.webp                 # 64x64 WebP
        sm.jpeg                 # 64x64 JPEG fallback
        md.webp                 # 128x128 WebP
        md.jpeg                 # 128x128 JPEG fallback
        lg.webp                 # 256x256 WebP
        lg.jpeg                 # 256x256 JPEG fallback
        xl.webp                 # 1024x1024 WebP (max stored)
        xl.jpeg                 # 1024x1024 JPEG fallback
    banner/
      {imageId}/
        sm.webp                 # 630x270 WebP
        sm.jpeg                 # 630x270 JPEG fallback
        md.webp                 # 1050x450 WebP
        md.jpeg                 # 1050x450 JPEG fallback
        lg.webp                 # 1680x720 WebP
        lg.jpeg                 # 1680x720 JPEG fallback
```

Both avatars and banners share the same `avatars` bucket with path-based separation.

## Database Schema Changes

### Profiles Table Updates

```sql
-- Add structured avatar data column
ALTER TABLE public.profiles
ADD COLUMN avatar_data jsonb;

-- Add structured banner data column
ALTER TABLE public.profiles
ADD COLUMN banner_data jsonb;

-- No GIN index needed - only queried by profile id
```

Note: `avatar_url` and `banner_url` columns will be kept nullable but no longer written to. They will be dropped in a future migration after backfill completes.

### Avatar/Banner Data Schema

```typescript
type ProcessingStatus = 'pending' | 'complete' | 'failed'

interface ImageData {
  version: 1
  imageId: string              // UUID for the image folder
  baseUrl: string              // Base storage URL without variant
  blurhash: string             // For placeholder rendering (4x4 for avatars, 6x4 for banners)
  processingStatus: ProcessingStatus  // Internal status tracking
  variants: Record<string, VariantUrls>
}

interface VariantUrls {
  webp: string
  jpeg: string
}

// Avatar-specific
interface AvatarData extends ImageData {
  variants: {
    xs: VariantUrls
    sm: VariantUrls
    md: VariantUrls
    lg: VariantUrls
    xl: VariantUrls
  }
}

// Banner-specific
interface BannerData extends ImageData {
  variants: {
    sm: VariantUrls
    md: VariantUrls
    lg: VariantUrls
  }
}
```

## Processing Pipeline

### Upload Flow

```
┌─────────────────┐
│  Client Upload  │
│  to Supabase    │
│  Storage        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Client calls    │
│ tRPC endpoint   │
│ with storage    │
│ path + blurhash │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Update profile  │
│ with pending    │
│ avatar_data +   │
│ blurhash        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Start Temporal  │
│ Workflow        │
│ (async)         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Client polls    │
│ profile (30s    │
│ timeout)        │
└────────┬────────┘
         │
    ┌────┴────┐
    │ Temporal│
    │ Worker  │
    └────┬────┘
         │
    ┌────┴────────────────┐
    │ Parallel Activities │
    │ (one per variant)   │
    └────┬────────────────┘
         │
    ┌────┼────┬────┬────┐
    ▼    ▼    ▼    ▼    ▼
  [xs] [sm] [md] [lg] [xl]
    │    │    │    │    │
    └────┴────┴────┴────┘
         │
         ▼
┌─────────────────┐
│ Update profile  │
│ avatar_data     │
│ status=complete │
└─────────────────┘
```

### Temporal Workflow: `processImage`

```typescript
// packages/workflows/src/image-workflow/workflow.ts

import { proxyActivities } from '@temporalio/workflow'
import type { createImageActivities } from './activities'

const AVATAR_SIZES = {
  xs: { width: 32, height: 32 },
  sm: { width: 64, height: 64 },
  md: { width: 128, height: 128 },
  lg: { width: 256, height: 256 },
  xl: { width: 1024, height: 1024 },
} as const

const BANNER_SIZES = {
  sm: { width: 630, height: 270 },
  md: { width: 1050, height: 450 },
  lg: { width: 1680, height: 720 },
} as const

const FORMATS = ['webp', 'jpeg'] as const
const QUALITY = 90

const {
  processVariantActivity,
  updateProfileImageDataActivity,
  deleteOldImageActivity,
} = proxyActivities<ReturnType<typeof createImageActivities>>({
  startToCloseTimeout: '2 minutes',
  retry: {
    maximumAttempts: 3,
  },
})

interface ProcessImageInput {
  userId: string
  storagePath: string      // Path to uploaded original in storage
  imageType: 'avatar' | 'banner'
  imageId: string          // UUID for new image folder
  previousImageId?: string // UUID of old image to delete
}

export async function processImage(input: ProcessImageInput) {
  const { userId, storagePath, imageType, imageId, previousImageId } = input

  const sizes = imageType === 'avatar' ? AVATAR_SIZES : BANNER_SIZES
  const basePath = `${userId}/${imageType}/${imageId}`

  // Process all variants in parallel
  const variantPromises = Object.entries(sizes).flatMap(([variant, dimensions]) =>
    FORMATS.map(format =>
      processVariantActivity({
        sourcePath: storagePath,
        outputPath: `${basePath}/${variant}.${format}`,
        width: dimensions.width,
        height: dimensions.height,
        format,
        quality: QUALITY,
      })
    )
  )

  await Promise.all(variantPromises)

  // Update profile with completed status
  await updateProfileImageDataActivity({
    userId,
    imageType,
    imageId,
    basePath,
    status: 'complete',
  })

  // Delete old image variants
  if (previousImageId) {
    await deleteOldImageActivity({
      userId,
      imageType,
      imageId: previousImageId,
    })
  }
}
```

### Activities

```typescript
// packages/workflows/src/image-workflow/activities.ts

import sharp from 'sharp'
import { createClient } from '@supabase/supabase-js'

export function createImageActivities() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  return {
    async processVariantActivity(input: {
      sourcePath: string
      outputPath: string
      width: number
      height: number
      format: 'webp' | 'jpeg'
      quality: number
    }) {
      const { sourcePath, outputPath, width, height, format, quality } = input

      // Download source image
      const { data: sourceData, error: downloadError } = await supabase.storage
        .from('avatars')
        .download(sourcePath)

      if (downloadError) throw downloadError

      const sourceBuffer = Buffer.from(await sourceData.arrayBuffer())

      // Process image (upscale if source is smaller than target)
      const processed = await sharp(sourceBuffer)
        .resize(width, height, {
          fit: 'cover',
          withoutEnlargement: false, // Allow upscaling
        })
        .removeMetadata() // Strip EXIF for privacy/security
        [format]({ quality })
        .toBuffer()

      // Upload processed variant
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(outputPath, processed, {
          contentType: `image/${format}`,
          cacheControl: '31536000', // 1 year (immutable)
          upsert: true,
        })

      if (uploadError) throw uploadError
    },

    async updateProfileImageDataActivity(input: {
      userId: string
      imageType: 'avatar' | 'banner'
      imageId: string
      basePath: string
      status: 'complete' | 'failed'
    }) {
      const { userId, imageType, imageId, basePath, status } = input

      const { data: { publicUrl: baseUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(basePath)

      const sizes = imageType === 'avatar'
        ? ['xs', 'sm', 'md', 'lg', 'xl']
        : ['sm', 'md', 'lg']

      const variants = Object.fromEntries(
        sizes.map(variant => [
          variant,
          {
            webp: `${baseUrl}/${variant}.webp`,
            jpeg: `${baseUrl}/${variant}.jpeg`,
          }
        ])
      )

      const column = imageType === 'avatar' ? 'avatar_data' : 'banner_data'

      await supabase
        .from('profiles')
        .update({
          [column]: {
            ...((await supabase.from('profiles').select(column).eq('id', userId).single()).data?.[column] ?? {}),
            processingStatus: status,
            variants,
          }
        })
        .eq('id', userId)
    },

    async deleteOldImageActivity(input: {
      userId: string
      imageType: 'avatar' | 'banner'
      imageId: string
    }) {
      const { userId, imageType, imageId } = input
      const folderPath = `${userId}/${imageType}/${imageId}`

      // List and delete all files in the old image folder
      const { data: files } = await supabase.storage
        .from('avatars')
        .list(folderPath)

      if (files && files.length > 0) {
        const paths = files.map(f => `${folderPath}/${f.name}`)
        await supabase.storage.from('avatars').remove(paths)
      }
    },
  }
}
```

## Client Implementation

### tRPC Endpoint

```typescript
// packages/api/src/routers/profile.ts

import { startWorkflow } from '@my/workflows/utils/startWorkflow'

export const profileRouter = router({
  uploadImage: protectedProcedure
    .input(z.object({
      storagePath: z.string(),
      imageType: z.enum(['avatar', 'banner']),
      blurhash: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { storagePath, imageType, blurhash } = input
      const userId = ctx.user.id
      const imageId = crypto.randomUUID()

      // Get current image ID for cleanup
      const { data: profile } = await ctx.supabase
        .from('profiles')
        .select('avatar_data, banner_data')
        .eq('id', userId)
        .single()

      const column = imageType === 'avatar' ? 'avatar_data' : 'banner_data'
      const previousImageId = profile?.[column]?.imageId

      // Set pending status with blurhash immediately
      const pendingData = {
        version: 1,
        imageId,
        baseUrl: '',
        blurhash,
        processingStatus: 'pending',
        variants: {},
      }

      await ctx.supabase
        .from('profiles')
        .update({ [column]: pendingData })
        .eq('id', userId)

      // Start Temporal workflow
      await startWorkflow({
        workflowType: 'processImage',
        workflowId: `process-${imageType}-${userId}-${imageId}`,
        args: [{
          userId,
          storagePath,
          imageType,
          imageId,
          previousImageId,
        }],
      })

      return { imageId, blurhash }
    }),
})
```

### Client Upload Flow

```typescript
// packages/app/features/account/hooks/useUploadProfileImage.ts

import { encode as encodeBlurHash } from 'blurhash'

export function useUploadProfileImage(imageType: 'avatar' | 'banner') {
  const supabase = useSupabase()
  const { user, updateProfile } = useUser()
  const utils = api.useUtils()
  const uploadMutation = api.profile.uploadImage.useMutation()

  const upload = async (base64Image: string) => {
    if (!user) return

    // Decode and upload to storage
    const buffer = decode(base64Image)
    const storagePath = `${user.id}/${Date.now()}.jpeg`

    const { error } = await supabase.storage
      .from('avatars')
      .upload(storagePath, buffer, {
        contentType: 'image/jpeg',
        upsert: true,
      })

    if (error) throw error

    // Generate blurhash client-side
    // (for avatars 4x4 components, for banners 6x4)
    const componentX = imageType === 'banner' ? 6 : 4
    const componentY = 4
    const blurhash = await generateBlurhash(base64Image, componentX, componentY)

    // Trigger workflow via tRPC
    await uploadMutation.mutateAsync({
      storagePath,
      imageType,
      blurhash,
    })

    // Poll for completion (30s timeout, then silent fallback)
    await pollForCompletion(utils, imageType, 30000)

    await updateProfile()
  }

  return { upload, isUploading: uploadMutation.isPending }
}

async function pollForCompletion(
  utils: ReturnType<typeof api.useUtils>,
  imageType: 'avatar' | 'banner',
  timeoutMs: number
) {
  const startTime = Date.now()
  const pollInterval = 2000 // 2 seconds

  while (Date.now() - startTime < timeoutMs) {
    await new Promise(r => setTimeout(r, pollInterval))

    const profile = await utils.profile.get.fetch()
    const data = imageType === 'avatar' ? profile?.avatar_data : profile?.banner_data

    if (data?.processingStatus === 'complete') {
      return // Success
    }
  }

  // Timeout reached - silent fallback to blurhash
  // Variants will appear on next visit
}
```

### Avatar URL Helper

```typescript
// packages/app/utils/avatar.ts

import { Platform } from 'react-native'

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
type BannerSize = 'sm' | 'md' | 'lg'

interface ImageData {
  version: number
  baseUrl: string
  blurhash: string
  processingStatus: 'pending' | 'complete' | 'failed'
  variants: Record<string, { webp: string; jpeg: string }>
}

export function getAvatarUrl(
  avatarData: ImageData | null,
  size: AvatarSize = 'md'
): string | null {
  if (!avatarData || avatarData.processingStatus !== 'complete') {
    return null
  }

  const variant = avatarData.variants[size]
  if (!variant) return null

  // WebP for all platforms (iOS 14+, Android, and web all support it)
  return variant.webp
}

export function getBannerUrl(
  bannerData: ImageData | null,
  size: BannerSize = 'md'
): string | null {
  if (!bannerData || bannerData.processingStatus !== 'complete') {
    return null
  }

  const variant = bannerData.variants[size]
  if (!variant) return null

  return variant.webp
}

export function getImagePlaceholder(
  imageData: ImageData | null
): string | undefined {
  return imageData?.blurhash
}
```

### ProfileAvatar Component

```typescript
// packages/ui/src/components/ProfileAvatar.tsx

import { Image } from 'expo-image'
import { getAvatarUrl, getImagePlaceholder } from '@my/app/utils/avatar'

interface ProfileAvatarProps {
  avatarData?: ImageData | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  // ... other props
}

export function ProfileAvatar({
  avatarData,
  size = 'md',
  ...props
}: ProfileAvatarProps) {
  const url = getAvatarUrl(avatarData, size)
  const blurhash = getImagePlaceholder(avatarData)

  // Show blurhash placeholder when:
  // - Processing is pending
  // - Processing failed (silent fallback)
  // - URL not available
  if (!url) {
    if (blurhash) {
      return (
        <Image
          placeholder={{ blurhash }}
          contentFit="cover"
          {...props}
        />
      )
    }
    return <FallbackAvatar {...props} />
  }

  return (
    <Image
      source={{ uri: url }}
      cachePolicy="disk"
      placeholder={blurhash ? { blurhash } : undefined}
      transition={200}
      contentFit="cover"
      {...props}
    />
  )
}
```

## Cache Strategy

### HTTP Cache Headers

| Resource | Cache-Control | CDN TTL | Browser TTL |
|----------|--------------|---------|-------------|
| Image variants | `public, max-age=31536000, immutable` | 1 year | 1 year |

Images are immutable by design (new uploads create new imageId folders).

### Supabase Storage Configuration

```sql
-- Update storage bucket settings
UPDATE storage.buckets
SET public = true,
    file_size_limit = 5242880,  -- 5MB
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'avatars';
```

## Migration Strategy

### Phase 1: Infrastructure

1. Add `avatar_data` and `banner_data` columns to profiles
2. Create Temporal workflow and activities in `packages/workflows/src/image-workflow/`
3. Add tRPC endpoint for upload triggering
4. Update storage bucket settings
5. Deploy workflow to existing Temporal worker (`apps/workers`)

### Phase 2: New Uploads

1. Update upload components to:
   - Generate blurhash client-side
   - Call new tRPC endpoint after storage upload
   - Poll for completion (30s timeout)
2. Add avatar/banner URL helpers
3. Update ProfileAvatar to use new data structure
4. Stop writing to `avatar_url` / `banner_url` columns

### Phase 3: Backfill (Temporal Workflow)

Create a backfill workflow for durability and rate limiting:

```typescript
// packages/workflows/src/image-workflow/backfill-workflow.ts

export async function backfillImages() {
  let cursor: string | null = null

  while (true) {
    const batch = await getNextBatchActivity({ cursor, limit: 100 })
    if (batch.profiles.length === 0) break

    for (const profile of batch.profiles) {
      if (profile.avatar_url && !profile.avatar_data) {
        await processExistingImageActivity({
          userId: profile.id,
          imageUrl: profile.avatar_url,
          imageType: 'avatar',
        })
      }
      if (profile.banner_url && !profile.banner_data) {
        await processExistingImageActivity({
          userId: profile.id,
          imageUrl: profile.banner_url,
          imageType: 'banner',
        })
      }

      // Rate limit: 100ms between profiles
      await sleep(100)
    }

    cursor = batch.nextCursor
  }
}
```

### Phase 4: Cleanup

1. Verify backfill completion
2. Update all remaining consumers to use `avatar_data` / `banner_data`
3. Drop `avatar_url` / `banner_url` columns in future migration

## Failure Handling

### Processing Failures

- Workflow retries activities up to 3 times with backoff
- If all retries fail, `processingStatus` remains `'pending'` (silent fallback)
- Client continues showing blurhash placeholder
- No user-facing error - variants will appear on successful retry or re-upload

### Old Image Cleanup Failures

- Cleanup is best-effort (final activity in workflow)
- Failed cleanup doesn't affect new image availability
- Orphaned files can be cleaned up via periodic maintenance job

## Monitoring

### Metrics (Temporal Built-in)

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| Workflow duration | Time from start to completion | > 30s |
| Activity failures | Per-activity failure rate | > 10% |
| Workflow failures | Full workflow failure rate | > 1% |

Use Temporal UI for monitoring and alerting on workflow health.

## Security Considerations

1. **Image transformation as sanitization**: Re-encoding through sharp discards original bytes, neutralizing polyglot attacks
2. **EXIF stripping**: `sharp().removeMetadata()` removes all metadata for privacy
3. **Size limits**: Storage bucket enforces 5MB limit
4. **RLS policies**: Maintain existing user-folder restrictions
5. **Content-Type validation**: Storage bucket restricts to image MIME types

## Rollback Plan

1. Workflow can be disabled without affecting existing images
2. Components fall back to blurhash if `processingStatus !== 'complete'`
3. Re-enable `avatar_url` / `banner_url` writes if needed (columns preserved)
4. Storage structure allows side-by-side old/new formats

## Future Enhancements

1. **AVIF support**: Add AVIF format for better compression when browser support matures
2. **Smart cropping**: AI-based face detection for better avatar crops
3. **CDN integration**: Cloudflare Images or similar for edge processing
4. **Video avatars**: Support for short animated avatars

## Appendix

### Size Comparison (Estimated @ 90% Quality)

| Format | 1024x1024 | 256x256 | 128x128 | 64x64 | 32x32 |
|--------|-----------|---------|---------|-------|-------|
| JPEG | ~80KB | ~18KB | ~6KB | ~2.5KB | ~1.2KB |
| WebP | ~55KB | ~12KB | ~4KB | ~1.8KB | ~0.9KB |

### Total Storage per Avatar

| Variants | Formats | Estimated Total |
|----------|---------|-----------------|
| 5 (xs, sm, md, lg, xl) | 2 (webp, jpeg) | ~100KB |

### Total Storage per Banner

| Variants | Formats | Estimated Total |
|----------|---------|-----------------|
| 3 (sm, md, lg) | 2 (webp, jpeg) | ~150KB |

### Bandwidth Savings (Estimated)

Current: ~100KB average avatar (unoptimized JPEG)
New: ~1.8KB average (sm WebP, most common use case)

**Savings: ~98% bandwidth reduction for typical avatar loads**
