import type { Database } from '@my/supabase/database.types'

type ProfileData = Database['public']['Functions']['profile_lookup']['Returns'][number]

export interface ProfileOpenGraphData {
  imageUrl: string
  title: string
  description: string
  canonicalUrl: string
}

/**
 * Generates OpenGraph image and metadata for a profile
 *
 * @param profile - Profile data from database
 * @param siteUrl - Base site URL (e.g., https://send.app)
 * @param route - The route for canonical URL (e.g., '/tag' or '/profile/123')
 * @returns OpenGraph data including API route for image and metadata
 */
export async function generateProfileOpenGraphData(
  profile: ProfileData,
  siteUrl: string,
  route: string
): Promise<ProfileOpenGraphData> {
  // Generate title
  const title = profile.main_tag_name ? `send.app/${profile.main_tag_name}` : 'Send | Profile'

  // Generate description
  const description =
    profile.about ||
    `Check out ${profile.main_tag_name ? `/${profile.main_tag_name}` : profile.sendid} on /send`

  // Generate canonical URL
  const canonicalUrl = `${siteUrl}${route}`

  // Generate OpenGraph image URL (using the consolidated API route)
  // Always provide a fallback to prevent undefined/empty imageUrl
  let imageUrl = 'https://ghassets.send.app/2024/04/send-og-image.png'

  if (profile.main_tag_name) {
    // For tag-based routes, use the tag parameter
    imageUrl = `${siteUrl}/api/og?type=tag&value=${encodeURIComponent(profile.main_tag_name)}`
  } else if (profile.sendid) {
    // For sendid-based routes, use the sendid parameter
    imageUrl = `${siteUrl}/api/og?type=sendid&value=${profile.sendid}`
  }
  // If neither condition is met, we keep the fallback image

  console.log('Generated OpenGraph image URL:', imageUrl)

  return {
    imageUrl,
    title,
    description,
    canonicalUrl,
  }
}
