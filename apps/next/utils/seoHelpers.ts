/**
 * SEO Helper functions for common patterns across the Send app
 *
 * This module provides standardized functions for generating consistent
 * SEO titles and descriptions across different page types.
 */

export type ProfileSeoData = {
  name?: string | null
  sendid?: number | null
  all_tags?: string[] | null
  tag?: string | null
  about?: string | null
  avatarUrl?: string | null
  bannerUrl?: string | null
}

export type SeoGenerationOptions = {
  siteUrl: string
  route: string
}

/**
 * Generates standardized profile page title
 *
 * @param profile - Profile data object
 * @returns Formatted title string
 */
export function generateProfileTitle(profile: ProfileSeoData): string {
  if (profile.tag) {
    const hostname = process.env.NEXT_PUBLIC_URL
      ? new URL(process.env.NEXT_PUBLIC_URL).hostname
      : 'send.app'
    return `${hostname}/${profile.tag}`
  }
  if (profile.name) {
    return `Send | ${profile.name}`
  }
  return 'Send | Profile'
}

/**
 * Generates standardized profile page description
 *
 * @param profile - Profile data object
 * @returns Formatted description string
 */
export function generateProfileDescription(profile: ProfileSeoData): string {
  // Use custom about text if available
  if (profile.about) {
    return profile.about
  }

  // Generate description based on available identifiers
  if (profile.name) {
    return `Learn more about ${profile.name} on Send`
  }

  if (profile.tag) {
    return `Check out /${profile.tag} on Send`
  }

  if (profile.sendid) {
    return `Check out ${profile.sendid} on Send`
  }

  return 'Peer-to-peer money. Send. Save. Invest.'
}

/**
 * Generates standardized canonical URL for profiles
 *
 * @param options - URL generation options
 * @returns Full canonical URL
 */
export function generateCanonicalUrl({ siteUrl, route }: SeoGenerationOptions): string {
  return `${siteUrl}${route}`
}

/**
 * Gets appropriate profile image URL with fallback
 *
 * @param profile - Profile data object
 * @param siteUrl - Base site URL for API routes
 * @returns Image URL (uses new profile API route with data as search params)
 */
export function getProfileImageUrl(profile: ProfileSeoData, siteUrl: string): string {
  const fallbackImage = 'https://ghassets.send.app/2024/04/send-og-image.png'

  // Only generate dynamic image if we have meaningful profile data
  if (profile.name || profile.avatarUrl || profile.all_tags?.length || profile.about) {
    const searchParams = new URLSearchParams()

    if (profile.name) searchParams.set('name', profile.name)
    if (profile.avatarUrl) searchParams.set('avatar_url', profile.avatarUrl)
    if (profile.bannerUrl) searchParams.set('banner_url', profile.bannerUrl)
    if (profile.all_tags && profile.all_tags.length > 0) {
      searchParams.set('all_tags', profile.all_tags.join(','))
    }
    if (profile.about) searchParams.set('about', profile.about)

    return `${siteUrl}/api/og/profile?${searchParams.toString()}`
  }

  return fallbackImage
}

/**
 * Generates complete SEO metadata for profile pages
 *
 * @param profile - Profile data object
 * @param options - URL generation options
 * @returns Complete SEO metadata object
 */
export function generateProfileSeoData(profile: ProfileSeoData, options: SeoGenerationOptions) {
  return {
    title: generateProfileTitle(profile),
    description: generateProfileDescription(profile),
    canonicalUrl: generateCanonicalUrl(options),
    imageUrl: getProfileImageUrl(profile, options.siteUrl),
  }
}

/**
 * Common page title patterns for consistency
 */
export const PAGE_TITLES = {
  home: 'Send',
  account: 'Send | Account',
  activity: 'Send | Activity',
  leaderboard: 'Send | Leaderboard',
  send: 'Send',
  notFound: '404 | Send',
  sendtagCheckout: 'Send | Sendtag Checkout',
} as const

/**
 * Common description patterns for consistency
 */
export const PAGE_DESCRIPTIONS = {
  home: 'Peer-to-peer money. Send. Save. Invest.',
  account:
    'Sendtags simplify transactions by replacing long wallet addresses with memorable identifiers.',
  activity: 'View your transaction history and account activity.',
  leaderboard: 'See top users and community activity on Send.',
  send: 'Send money to anyone, anywhere, instantly.',
  notFound: 'Not found. Send, Instant Payments.',
  sendtagCheckout:
    'Sendtags simplify transactions by replacing long wallet addresses with memorable identifiers.',
} as const

/**
 * Format amount for display in OG images and SEO.
 * - Shows up to 4 decimal places, trimming trailing zeros
 * - For small numbers (< 1), shows 4 significant figures
 */
export function formatAmountForDisplay(amount: string | number): string {
  const num = typeof amount === 'string' ? Number.parseFloat(amount) : amount

  if (Number.isNaN(num) || num === 0) return typeof amount === 'string' ? amount : '0'

  // For small numbers (< 1), use 4 significant figures
  if (Math.abs(num) < 1) {
    const precise = num.toPrecision(4)
    return Number.parseFloat(precise).toString()
  }

  // For larger numbers, show up to 4 decimal places
  const fixed = num.toFixed(4)
  const trimmed = Number.parseFloat(fixed)

  return trimmed.toLocaleString('en-US', {
    maximumFractionDigits: 4,
    minimumFractionDigits: 0,
  })
}

/**
 * Check SEO data types and helpers
 */
export type CheckSeoData = {
  amount?: string
  symbol?: string
  additionalCount?: number
}

export type CheckSeoOptions = {
  siteUrl: string
  route: string
}

/**
 * Generates standardized check page title
 */
export function generateCheckTitle(check: CheckSeoData): string {
  if (check.amount && check.symbol) {
    const additional = check.additionalCount ? ` (+${check.additionalCount} more)` : ''
    return `Claim ${check.amount} ${check.symbol}${additional} | Send`
  }
  return 'Claim Check | Send'
}

/**
 * Generates standardized check page description
 */
export function generateCheckDescription(check: CheckSeoData): string {
  if (check.amount && check.symbol) {
    const additional = check.additionalCount
      ? ` and ${check.additionalCount} more token${check.additionalCount > 1 ? 's' : ''}`
      : ''
    return `Someone sent you ${check.amount} ${check.symbol}${additional}! Create an account to claim.`
  }
  return 'Someone sent you tokens! Create an account to claim.'
}

/**
 * Gets check OG image URL with dynamic parameters
 */
export function getCheckImageUrl(check: CheckSeoData, siteUrl: string): string {
  const fallbackImage = 'https://ghassets.send.app/2024/04/send-og-image.png'

  if (check.amount && check.symbol) {
    const searchParams = new URLSearchParams()
    searchParams.set('amount', check.amount)
    searchParams.set('symbol', check.symbol)
    if (check.additionalCount && check.additionalCount > 0) {
      searchParams.set('additional_count', String(check.additionalCount))
    }
    return `${siteUrl}/api/og/check?${searchParams.toString()}`
  }

  return fallbackImage
}

/**
 * Generates complete SEO metadata for check pages
 */
export function generateCheckSeoData(check: CheckSeoData, options: CheckSeoOptions) {
  return {
    title: generateCheckTitle(check),
    description: generateCheckDescription(check),
    canonicalUrl: generateCanonicalUrl(options),
    imageUrl: getCheckImageUrl(check, options.siteUrl),
  }
}
