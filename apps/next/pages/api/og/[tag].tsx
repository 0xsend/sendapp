import { ImageResponse } from '@vercel/og'
import type { NextRequest } from 'next/server'
import { createSupabaseAdminClient } from 'app/utils/supabase/admin'
import { z } from 'zod'
import { profileReactElement, loadGoogleFont } from './components/profile'

export const config = {
  runtime: 'edge',
}

// Edge-runtime compatible sendtag validation (extracted to avoid UI component imports)
const SendtagSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(20)
    .trim()
    // English alphabet, numbers, and underscore
    .regex(/^[a-zA-Z0-9_]+$/, 'Only English alphabet, numbers, and underscore'),
})

/**
 * OpenGraph image generation for user profiles by tag
 * Used for /[tag] routes
 *
 * @businessLogic
 * Generates social media preview images for profile pages accessed via tag
 * Uses the same avatar fallback pattern as the profile screen component
 *
 * @edgeCases
 * - Returns 404 for invalid tag format or non-public profiles
 * - Validates tag using SendtagSchema before lookup
 * - Falls back to ui-avatars.com when no avatar_url exists
 */
export default async function handler(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const tagParam = url.pathname.split('/').pop()

    if (!tagParam) {
      return new Response('Missing tag parameter', { status: 400 })
    }

    // Validate tag format using the same schema as the tag route
    const result = SendtagSchema.safeParse({
      name: tagParam.match(/^@/) ? tagParam.slice(1) : tagParam,
    })

    if (!result.success) {
      return new Response('Invalid tag format', { status: 400 })
    }

    const { name: tag } = result.data

    // Fetch profile data using tag lookup
    const supabaseAdmin = createSupabaseAdminClient()
    const { data: profile, error } = await supabaseAdmin
      .rpc('profile_lookup', { lookup_type: 'tag', identifier: tag })
      .single()

    if (error) {
      console.error('Error fetching profile for OG image by tag:', error)
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
    console.error('Error generating OG image by tag:', e)
    return new Response('Failed to generate image', { status: 500 })
  }
}
