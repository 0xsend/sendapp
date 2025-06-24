import { ImageResponse } from '@vercel/og'
import type { NextRequest } from 'next/server'
import { createSupabaseAdminClient } from 'app/utils/supabase/admin'
import { loadGoogleFont, profileReactElement } from '../components/profile'

export const config = {
  runtime: 'edge',
}

/**
 * OpenGraph image generation for user profiles by sendid
 * Used for /profile/[sendid] routes
 *
 * @businessLogic
 * Generates social media preview images for profile pages using the same
 * avatar fallback pattern as the profile screen component
 *
 * @edgeCases
 * - Returns 404 for invalid sendid or non-public profiles
 * - Falls back to ui-avatars.com when no avatar_url exists
 */
export default async function handler(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const sendidParam = url.pathname.split('/').pop()

    if (!sendidParam) {
      return new Response('Missing sendid parameter', { status: 400 })
    }

    const sendid = Number(sendidParam)
    if (Number.isNaN(sendid)) {
      return new Response('Invalid sendid', { status: 400 })
    }

    // Fetch profile data using the same pattern as other sendapp code
    const supabaseAdmin = createSupabaseAdminClient()
    const { data: profile, error } = await supabaseAdmin
      .rpc('profile_lookup', { lookup_type: 'sendid', identifier: sendid.toString() })
      .single()

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
