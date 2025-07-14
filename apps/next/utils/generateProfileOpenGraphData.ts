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

  // Generate OpenGraph image URL (using the existing API routes)
  let imageUrl = ''

  if (profile.main_tag_name) {
    // For tag-based routes, use the tag API endpoint
    imageUrl = `${siteUrl}/api/og/${profile.main_tag_name}`
  } else {
    // For sendid-based routes, use the sendid API endpoint
    imageUrl = `${siteUrl}/api/og/profile/${profile.sendid}`
  }

  return {
    imageUrl,
    title,
    description,
    canonicalUrl,
  }
}
