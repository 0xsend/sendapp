import { ProfileScreen } from 'app/features/profile/screen'
import { ExternalAddressScreen } from 'app/features/profile/ExternalAddressScreen'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'
import type { NextPageWithLayout } from '../../_app'
import type { GetServerSideProps, GetServerSidePropsContext } from 'next'
import type { Database } from '@my/supabase/database.types'
import { userOnboarded } from 'utils/userOnboarded'
import { createSupabaseAdminClient } from 'app/utils/supabase/admin'
import { HomeLayout } from 'app/features/home/layout.web'
import { buildSeo } from 'utils/seo'
import { generateProfileSeoData, type ProfileSeoData } from 'utils/seoHelpers'
import { isAddress, type Address } from 'viem'

import { ProfileTopNav } from 'app/components/ProfileTopNav'

interface PageProps {
  sendid?: number
  address?: Address
  isExternalAddress?: boolean
  seo: ReturnType<typeof buildSeo>
}

export const Page: NextPageWithLayout<PageProps> = ({ sendid, address, isExternalAddress }) => {
  if (isExternalAddress && address) {
    return <ExternalAddressScreen address={address} />
  }
  return <ProfileScreen sendid={sendid} />
}

// Profile page is not protected, but we need to look up the user profile by tag in case we have to show a 404
export const getServerSideProps = (async (ctx: GetServerSidePropsContext) => {
  const { sendid: sendidParam } = ctx.params ?? {}
  const identifier = sendidParam as string

  // Get site URL securely using Vercel environment variables
  const siteUrl = process.env.NEXT_PUBLIC_URL || 'https://send.app'

  const supabase = createPagesServerClient<Database>(ctx)
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    // not anonymous user
    // check if user is onboarded
    const needsOnboarding = await userOnboarded(supabase, ctx)
    if (needsOnboarding) return needsOnboarding
  }

  const supabaseAdmin = createSupabaseAdminClient()

  // Detect if identifier is an Ethereum address (0x + 40 hex characters)
  if (isAddress(identifier)) {
    // Look up by address to check if this address has a Send account
    const { data: profile, error } = await supabaseAdmin
      .rpc('profile_lookup', { lookup_type: 'address', identifier })
      .maybeSingle()

    if (error) {
      console.error('Error fetching profile from address', error)
      throw error
    }

    if (profile) {
      // Check if profile is public or user is logged in before redirecting
      if (!profile.is_public && !session) {
        // Private profile and anonymous user - return 404 to avoid leaking account existence
        return { notFound: true }
      }
      // Address has a Send account - redirect to canonical URL
      const redirectUrl = profile.main_tag_name
        ? `/${profile.main_tag_name}`
        : `/profile/${profile.sendid}`
      return { redirect: { destination: redirectUrl, permanent: false } }
    }

    // No Send account - render minimal address view
    // Cache responses for anonymous users
    if (!session) {
      ctx.res.setHeader(
        'Cache-Control',
        'public, s-maxage=86400, max-age=3600, stale-while-revalidate=172800'
      )
      ctx.res.setHeader('CDN-Cache-Control', 'max-age=86400')
    } else {
      ctx.res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate')
    }

    // Generate SEO for external address
    const truncatedAddress = `${identifier.slice(0, 6)}...${identifier.slice(-4)}`
    const seo = buildSeo({
      title: `Send | ${truncatedAddress}`,
      description: `View activity and send to ${truncatedAddress} on Send`,
      url: `${siteUrl}/profile/${identifier}`,
      type: 'profile',
    })

    return {
      props: {
        address: identifier,
        isExternalAddress: true,
        seo,
      },
    }
  }

  // Invalid 0x-prefixed identifiers that aren't valid addresses should 404
  if (identifier.startsWith('0x')) {
    return { notFound: true }
  }

  // Handle numeric sendid lookup (existing behavior)
  const sendid = Number(identifier)

  if (Number.isNaN(sendid)) {
    return {
      notFound: true,
    }
  }

  // check if profile exists
  const { data: profile, error } = await supabaseAdmin
    .rpc('profile_lookup', { lookup_type: 'sendid', identifier: sendid.toString() })
    .maybeSingle()

  if (error) {
    console.error('Error fetching profile from sendid', error)
    throw error
  }

  if (profile === null || (!profile.is_public && !session)) {
    // no profile or profile is private and user is not logged in
    // return 404
    return {
      notFound: true,
    }
  }

  // Cache responses for anonymous users (including social media crawlers)
  // but always serve fresh data to logged-in users
  if (!session) {
    // Anonymous users get cached responses - prevents social media crawler spam
    ctx.res.setHeader(
      'Cache-Control',
      'public, s-maxage=86400, max-age=3600, stale-while-revalidate=172800'
    )
    ctx.res.setHeader('CDN-Cache-Control', 'max-age=86400')
  } else {
    // Logged-in users always get fresh data
    ctx.res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate')
  }

  // Generate SEO data using helper functions
  const profileData: ProfileSeoData = {
    name: profile.name || undefined,
    sendid: profile.sendid ?? undefined,
    all_tags: profile.all_tags,
    tag: profile.main_tag_name || undefined,
    about: profile.about || undefined,
    avatarUrl: profile.avatar_url || undefined,
    bannerUrl: profile.banner_url || undefined,
  }
  const profileSeoData = generateProfileSeoData(profileData, {
    siteUrl,
    route: `/profile/${sendid}`,
  })

  // Generate SEO configuration server-side
  const seo = buildSeo({
    title: profileSeoData?.title || 'Send | Profile',
    description: profileSeoData?.description || `Check out ${sendid} on Send`,
    url: profileSeoData?.canonicalUrl || `${siteUrl}/profile/${sendid}`,
    image: profileSeoData?.imageUrl,
    type: 'profile',
  })

  return {
    props: {
      sendid,
      seo,
    },
  }
}) satisfies GetServerSideProps

Page.getLayout = (children) => <HomeLayout TopNav={<ProfileTopNav />}>{children}</HomeLayout>

export default Page
