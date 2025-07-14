import { ImageResponse } from '@vercel/og'
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import type { Database } from '@my/supabase/database.types'
import type React from 'react'

/**
 * Edge Runtime compatible Supabase RPC client
 * Uses direct HTTP calls instead of @supabase/supabase-js to avoid Node.js dependencies
 */
const callSupabaseRPC = async (functionName: string, params: Record<string, unknown>) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
  }
  if (!supabaseServiceRole) {
    throw new Error('SUPABASE_SERVICE_ROLE is not set')
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseServiceRole,
      Authorization: `Bearer ${supabaseServiceRole}`,
    },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Supabase RPC error: ${response.status} ${errorText}`)
  }

  return response.json()
}

export const config = {
  runtime: 'edge',
}

// Edge-runtime compatible sendtag validation
const SendtagSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(20)
    .trim()
    .regex(/^[a-zA-Z0-9_]+$/, 'Only English alphabet, numbers, and underscore'),
})

async function loadGoogleFont(font: string, weight: number, text: string) {
  const url = `https://fonts.googleapis.com/css2?family=${font}:wght@${weight}&text=${encodeURIComponent(text)}`
  const css = await (await fetch(url)).text()
  const resource = css.match(/src: url\((.+)\) format\('(opentype|truetype)'\)/)

  if (resource) {
    const response = await fetch(resource[1])
    if (response.status === 200) {
      return await response.arrayBuffer()
    }
  }

  throw new Error('failed to load font data')
}

const profileReactElement = (
  profile: Database['public']['Functions']['profile_lookup']['Returns'][number]
): React.ReactElement => {
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
              fontWeight: 600,
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
 * Consolidated OpenGraph image generation API route
 * Handles both tag-based and sendid-based profile image generation
 *
 * Query parameters:
 * - type: 'tag' | 'sendid'
 * - value: the tag name or sendid value
 *
 * Examples:
 * - /api/og?type=tag&value=johndoe
 * - /api/og?type=sendid&value=123
 *
 * @businessLogic
 * Generates social media preview images for profile pages using the same
 * avatar fallback pattern as the profile screen component
 *
 * @edgeCases
 * - Returns 400 for missing or invalid parameters
 * - Returns 404 for invalid sendid/tag or non-public profiles
 * - Falls back to random auth images when no avatar_url exists
 */
export default async function handler(req: NextRequest) {
  try {
    // Use nextUrl instead of new URL(req.url) for Edge Runtime compatibility
    const { searchParams } = req.nextUrl
    const type = searchParams.get('type')
    const value = searchParams.get('value')

    if (!type || !value) {
      return new Response('Missing type or value parameter', { status: 400 })
    }

    if (type !== 'tag' && type !== 'sendid') {
      return new Response('Invalid type parameter. Must be "tag" or "sendid"', { status: 400 })
    }

    let profile: Database['public']['Functions']['profile_lookup']['Returns'][number] | null = null
    let error: unknown = null

    if (type === 'tag') {
      // Validate tag format
      const result = SendtagSchema.safeParse({
        name: value.match(/^@/) ? value.slice(1) : value,
      })

      if (!result.success) {
        return new Response('Invalid tag format', { status: 400 })
      }

      const { name: tag } = result.data

      try {
        const data = await callSupabaseRPC('profile_lookup', {
          lookup_type: 'tag',
          identifier: tag,
        })
        // Supabase RPC returns array, get first item or null for maybeSingle behavior
        profile = Array.isArray(data) && data.length > 0 ? data[0] : null
      } catch (tagError) {
        error = tagError
      }
    } else {
      // sendid lookup
      const sendid = Number(value)
      if (Number.isNaN(sendid)) {
        return new Response('Invalid sendid', { status: 400 })
      }

      try {
        const data = await callSupabaseRPC('profile_lookup', {
          lookup_type: 'sendid',
          identifier: sendid.toString(),
        })
        // Supabase RPC returns array, get first item or null for maybeSingle behavior
        profile = Array.isArray(data) && data.length > 0 ? data[0] : null
      } catch (sendidError) {
        error = sendidError
      }
    }

    if (error) {
      console.error('Error fetching profile for OG image:', error)
      return new Response('Error fetching profile', { status: 500 })
    }

    if (!profile || !profile.is_public) {
      return new Response('Profile not found or not public', { status: 404 })
    }

    // Collect all text that will be rendered for font optimization
    const text = [profile.name || '', profile.tag || '', profile.about || '', '/send']
      .concat(profile?.all_tags || [])
      .join('')

    return new ImageResponse(profileReactElement(profile), {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'DM Sans',
          data: await loadGoogleFont('DM Sans', 400, text),
          style: 'normal',
          weight: 400,
        },
        {
          name: 'DM Sans',
          data: await loadGoogleFont('DM Sans', 500, text),
          style: 'normal',
          weight: 500,
        },
        {
          name: 'DM Sans',
          data: await loadGoogleFont('DM Sans', 700, text),
          style: 'normal',
          weight: 700,
        },
      ],
    })
  } catch (e) {
    console.error('Error generating OG image:', e)
    return new Response('Failed to generate image', { status: 500 })
  }
}
