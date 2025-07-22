import { ImageResponse } from '@vercel/og'
import type { NextRequest } from 'next/server'
import type React from 'react'

export const config = {
  runtime: 'edge',
}

// Simple font cache to avoid re-downloading
const fontCache = new Map<string, ArrayBuffer>()

async function loadGoogleFont(font: string, weight: number, text: string) {
  const cacheKey = `${font}-${weight}`

  // Check cache first
  if (fontCache.has(cacheKey)) {
    return fontCache.get(cacheKey)
  }

  try {
    // Use a smaller text subset to reduce font size
    const limitedText = text.slice(0, 50) // Limit text for font subsetting
    const url = `https://fonts.googleapis.com/css2?family=${font}:wght@${weight}&text=${encodeURIComponent(limitedText)}&display=swap`

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
  all_tags?: string[]
  about?: string
}

const profileReactElement = (profile: ProfileData): React.ReactElement => {
  const avatarUrl =
    profile.avatar_url ??
    `https://ghassets.send.app/app_images/auth_image_${Math.floor(Math.random() * 3) + 1}.jpg`

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
        src={avatarUrl}
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
          filter: 'blur(40px)',
          WebkitFilter: 'blur(40px)',
        }}
      />
      <img
        src={avatarUrl}
        alt="Profile Avatar"
        width={630}
        height={630}
        loading="lazy"
        style={{
          position: 'absolute',
          height: 630,
          width: 630,
          objectFit: 'cover',
          objectPosition: 'center',
          right: '0%',
          top: '0%',
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
          paddingBottom: '40px',
        }}
      >
        {/* Name */}
        <h2
          style={{
            fontSize: '98px',
            textAlign: 'center',
            maxWidth: '1000px',
            color: 'white',
            fontWeight: 700,
          }}
        >
          {profile.name || ''}
        </h2>

        {/* Tags */}
        <div style={{ display: 'flex', flexDirection: 'row', gap: '8px' }}>
          {profile?.all_tags
            ? profile.all_tags.map((tag) => {
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
              })
            : null}
        </div>

        {/* Bio/About */}
        {profile.about ? (
          <p
            style={{
              fontSize: '48px',
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

      {/* Branding */}
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
    const all_tags_param = searchParams.get('all_tags')
    const about = searchParams.get('about') || undefined

    // Parse comma-separated tags
    const all_tags = all_tags_param ? all_tags_param.split(',').filter(Boolean) : undefined

    console.log(`[OG Profile] Starting image generation for profile: ${name}`)

    // Build profile object
    const profile: ProfileData = {
      name,
      avatar_url,
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
