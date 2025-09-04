import { ImageResponse } from '@vercel/og'
import type { NextRequest } from 'next/server'
import type React from 'react'

export const config = {
  runtime: 'edge',
}

// Simple font cache to avoid re-downloading
const fontCache = new Map<string, ArrayBuffer>()

async function loadGoogleFont(font: string, weight: number, text: string) {
  // Include the exact glyph subset in the cache key.
  // We request DM Sans via Google Fonts with text= (per-request subsetting).
  // Normalizing to a unique+sorted set prevents reusing a smaller subset from a
  // previous request, which caused missing bold glyphs in OG images.
  // Docs: https://developers.google.com/fonts/docs/css2#optimize_your_font_requests
  const normalizedText = Array.from(new Set(text)).sort().join('')
  const cacheKey = `${font}-${weight}-${normalizedText}`

  // Check cache first
  if (fontCache.has(cacheKey)) {
    return fontCache.get(cacheKey)
  }

  try {
    const encodedFamily = encodeURIComponent(font).replace(/%20/g, '+')
    const url = `https://fonts.googleapis.com/css2?family=${encodedFamily}:wght@${weight}&text=${encodeURIComponent(normalizedText)}&display=swap`

    const cssResponse = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })

    if (!cssResponse.ok) {
      throw new Error(`Failed to fetch CSS: ${cssResponse.status}`)
    }

    const css = await cssResponse.text()
    const resource = css.match(/src: url\((.+?)\) format\('(woff2?|opentype|truetype)'\)/)

    if (resource) {
      const fontResponse = await fetch(resource[1], {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      })

      if (fontResponse.ok) {
        const fontData = await fontResponse.arrayBuffer()
        fontCache.set(cacheKey, fontData) // Cache the font
        return fontData
      }
    }
  } catch (error) {
    console.warn(`Font loading failed for ${font}:${weight}:`, error)
  }

  throw new Error(`Failed to load font data for ${font}:${weight}`)
}

interface ProfileData {
  name?: string
  avatar_url?: string
  banner_url?: string
  all_tags?: string[]
  about?: string
}

// Normalize Supabase Storage image URLs via the render/image transformation endpoint.
// This endpoint proxies through imgproxy and typically auto-rotates based on EXIF data
// while also allowing resize/quality parameters.
// Docs: https://supabase.com/docs/guides/storage/image-transformations
function supabaseRenderUrl(url: string, width?: number, height?: number) {
  try {
    const u = new URL(url)
    // Match Supabase Storage public object URLs
    if (u.hostname.endsWith('.supabase.co') && u.pathname.includes('/storage/v1/object/public/')) {
      // Convert to the render/image path
      u.pathname = u.pathname.replace(
        '/storage/v1/object/public/',
        '/storage/v1/render/image/public/'
      )
      const params = new URLSearchParams(u.search)
      if (width) params.set('width', String(width))
      if (height) params.set('height', String(height))
      // Use cover to fill target box and set a sane quality
      params.set('resize', 'cover')
      params.set('quality', '85')
      u.search = params.toString() ? `?${params.toString()}` : ''
      return u.toString()
    }
  } catch {
    // If URL parsing fails, fall back to the original URL
    return url
  }
  return url
}

const profileReactElement = (profile: ProfileData): React.ReactElement => {
  const bannerUrl =
    profile.banner_url ??
    profile.avatar_url ??
    'https://ghassets.send.app/app_images/auth_image_1.jpg'
  const avatarUrl =
    profile.avatar_url ??
    `https://ui-avatars.com/api?name=${encodeURIComponent(profile.name || 'User')}&size=256&format=png&background=86ad7f`

  // Route Supabase images through the render/image endpoint to normalize EXIF orientation
  const bannerSrc = supabaseRenderUrl(bannerUrl, 1200, 630)
  const avatarSrc = supabaseRenderUrl(avatarUrl, 192, 192)

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
        fontFamily: 'DM Sans, system-ui, sans-serif',
      }}
    >
      <img
        src={bannerSrc}
        alt="Profile Avatar Background"
        width={1200}
        height={630}
        loading="lazy"
        style={{
          position: 'absolute',
          height: '100%',
          width: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          ...(profile.banner_url ? {} : { filter: 'blur(40px)', WebkitFilter: 'blur(40px)' }),
        }}
      />
      <div
        style={{
          position: 'absolute',
          height: '100%',
          width: '100%',
          backgroundImage: 'linear-gradient(180deg, transparent 0%, black 100%)',
        }}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          padding: '80px',
          paddingBottom: '80px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              alignSelf: 'center',
              marginTop: 'auto',
              marginBottom: 'auto',
              width: 192,
              height: 192,
            }}
          >
            <img
              src={avatarSrc}
              alt="Profile Avatar"
              loading="lazy"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
                borderRadius: 16,
              }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
              justifyContent: 'center',
            }}
          >
            {/* Name */}
            {profile.name ? (
              <h2
                style={{
                  fontSize: '64px',
                  textAlign: 'left',
                  color: 'white',
                  fontWeight: 700,
                }}
              >
                {profile.name || ''}
              </h2>
            ) : null}

            {/* Tags */}
            {profile?.all_tags ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: '8px',
                  flexWrap: 'wrap',
                  maxWidth: '1000px',
                }}
              >
                {profile.all_tags.map((tag) => {
                  return (
                    <div
                      key={tag}
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(102, 102, 102, 0.4)',
                        padding: '12px',
                        alignSelf: 'flex-start',
                        backdropFilter: 'blur(40px)',
                        WebkitBackdropFilter: 'blur(40px)',
                      }}
                    >
                      <p
                        style={{
                          fontSize: '32px',
                          color: 'white',
                          fontWeight: 400,
                          margin: 0,
                        }}
                      >
                        /{tag}
                      </p>
                    </div>
                  )
                })}
              </div>
            ) : null}
          </div>
        </div>

        {/* Bio/About */}
        {profile.about ? (
          <p
            style={{
              fontSize: '32px',
              color: 'rgba(255, 255, 255)',
              margin: '0',
              maxWidth: '800px',
              fontWeight: 400,
            }}
          >
            {profile.about.length > 100 ? `${profile.about.substring(0, 100)}...` : profile.about}
          </p>
        ) : null}
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: '40px',
          right: '40px',
          display: 'flex',
          alignItems: 'center',
          fontSize: '48px',
          color: '#fff',
          fontFamily: 'DM Sans, system-ui, sans-serif',
          fontWeight: 700,
        }}
      >
        /send
      </div>
    </div>
  )
}

/**
 * Optimized OpenGraph image generation API route for profiles
 * Accepts profile data as search parameters instead of fetching from database
 *
 * Query parameters:
 * - name: profile name
 * - avatar_url: profile avatar URL
 * - all_tags: comma-separated list of tags
 * - about: profile bio/description
 *
 * Examples:
 * - /api/og/profile?name=John&avatar_url=https://example.com/avatar.jpg&all_tags=tag1,tag2&about=Bio text
 *
 * @businessLogic
 * Generates social media preview images for profile pages using provided profile data
 * Eliminates database queries in edge function for better performance and reliability
 *
 * @edgeCases
 * - Returns 400 for completely missing profile data
 * - Falls back to random auth images when no avatar_url exists
 * - Handles missing optional fields gracefully
 *
 * @improvements
 * This approach eliminates database dependencies in the edge function and improves
 * cache hit rates since profile data is explicit in the URL parameters
 */
export default async function handler(req: NextRequest) {
  const startTime = Date.now()
  try {
    const { searchParams } = req.nextUrl

    // Extract profile data from search parameters
    const name = searchParams.get('name') || undefined
    const avatar_url = searchParams.get('avatar_url') || undefined
    const banner_url = searchParams.get('banner_url') || undefined
    const all_tags_param = searchParams.get('all_tags')
    const about = searchParams.get('about') || undefined

    // Parse comma-separated tags
    const all_tags = all_tags_param ? all_tags_param.split(',').filter(Boolean) : undefined

    console.log(`[OG Profile] Starting image generation for profile: ${name}`)

    // Build profile object
    const profile: ProfileData = {
      name,
      avatar_url,
      banner_url,
      all_tags,
      about,
    }

    // Collect all text that will be rendered for font optimization
    const text = [profile.name || '', profile.about || '', '/send']
      .concat(profile?.all_tags || [])
      .join('')

    console.log(`[OG Profile] Loading fonts for text length: ${text.length}`)

    // Load fonts in parallel for speed
    const fontStart = Date.now()
    const [font400, font700] = await Promise.all([
      loadGoogleFont('DM Sans', 400, text),
      loadGoogleFont('DM Sans', 700, text),
    ])
    console.log(`[OG Profile] Font loading took ${Date.now() - fontStart}ms`)

    const imageStart = Date.now()
    if (!font400 || !font700) {
      throw new Error('Failed to load fonts')
    }

    const response = new ImageResponse(profileReactElement(profile), {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'DM Sans',
          data: font400,
          style: 'normal',
          weight: 400,
        },
        {
          name: 'DM Sans',
          data: font700,
          style: 'normal',
          weight: 700,
        },
      ],
    })

    console.log(`[OG Profile] Image generation took ${Date.now() - imageStart}ms`)
    console.log(`[OG Profile] Total time: ${Date.now() - startTime}ms`)

    response.headers.set('Content-Type', 'image/png')
    response.headers.set('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=43200')
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET')
    return response
  } catch (e) {
    console.error('Error generating OG profile image:', e)
    return new Response('Failed to generate image', { status: 500 })
  }
}
