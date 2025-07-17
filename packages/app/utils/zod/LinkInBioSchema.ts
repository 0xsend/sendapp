import type { Database } from '@my/supabase/database-generated.types'
import { z } from 'zod'

/**
 * Social domain names enum based on database enum
 */
export const LinkInBioDomainNamesEnum = z.enum([
  'X',
  'Instagram',
  'YouTube',
  'TikTok',
  'GitHub',
  'Telegram',
  'Discord',
] as const satisfies readonly Database['public']['Enums']['link_in_bio_domain_names'][])

/**
 * Single link in bio schema
 */
export const LinkInBioSchema = z.object({
  /**
   * Social platform domain name
   */
  domain_name: LinkInBioDomainNamesEnum,
  /**
   * User handle/username on the platform
   */
  handle: z.string().nullable(),
  /**
   * Generated domain URL for the platform
   */
  domain: z.string(),
})

/**
 * Array of social links schema
 */
export const LinkInBiosSchema = z.array(LinkInBioSchema)

/**
 * Type definitions for TypeScript
 */
export type LinkInBioDomainName = z.infer<typeof LinkInBioDomainNamesEnum>
export type LinkInBio = z.infer<typeof LinkInBioSchema>
export type LinkInBios = z.infer<typeof LinkInBiosSchema>
