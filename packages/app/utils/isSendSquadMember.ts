import type { Tables } from '@my/supabase/database.types'

/**
 * Checks if any of the user's tags are present in the NEXT_PUBLIC_SENDSQUAD_TAGS environment variable.
 *
 * If the environment variable is not set or empty, access is allowed by default.
 *
 * @param tags - An array of tag objects from the 'tags' table, or null/undefined.
 * @returns True if the user has at least one tag listed in the environment variable, false otherwise.
 */
export function isSendSquadMember(tags: Tables<'tags'>[] | null | undefined): boolean {
  const sendsquadTagsEnv = process.env.NEXT_PUBLIC_SENDSQUAD_TAGS

  // If the environment variable is not set or empty, allow access by default
  if (!sendsquadTagsEnv) {
    return true
  }

  // Parse the environment variable into a set of lowercase tags for efficient lookup
  const allowedTags = new Set(
    sendsquadTagsEnv
      .split(',')
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean) // Remove empty strings resulting from extra commas
  )

  // If there are no allowed tags defined, deny access
  if (allowedTags.size === 0) {
    return false
  }

  // If the user has no tags, they cannot be part of the sendsquad
  if (!tags || tags.length === 0) {
    return false
  }

  // Check if any of the user's tags (case-insensitive) are in the allowed set
  return tags.some((tag) => allowedTags.has(tag.name.toLowerCase()))
}
