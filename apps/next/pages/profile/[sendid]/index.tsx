import { ProfileScreen } from 'app/features/profile/screen'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'
import type { NextPageWithLayout } from '../../_app'
import type { GetServerSideProps, GetServerSidePropsContext } from 'next'
import type { Database } from '@my/supabase/database.types'
import { userOnboarded } from 'utils/userOnboarded'
import { createSupabaseAdminClient } from 'app/utils/supabase/admin'
import { ProfileLayout } from 'app/features/profile/layout.web'
import { buildSeo } from 'utils/seo'
import { generateProfileSeoData, type ProfileSeoData } from 'utils/seoHelpers'

interface PageProps {
  sendid?: number
  seo: ReturnType<typeof buildSeo>
}

export const Page: NextPageWithLayout<PageProps> = ({ sendid }) => {
  return <ProfileScreen sendid={sendid} />
}

// Profile page is not protected, but we need to look up the user profile by tag in case we have to show a 404
export const getServerSideProps = (async (ctx: GetServerSidePropsContext) => {
  const { sendid: sendidParam } = ctx.params ?? {}
  const sendid = Number(sendidParam)

  if (Number.isNaN(sendid)) {
    return {
      notFound: true,
    }
  }

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

  // check if profile exists
  const supabaseAdmin = createSupabaseAdminClient()
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

  console.log('Server-side SEO generated:', seo)

  return {
    props: {
      sendid,
      seo,
    },
  }
}) satisfies GetServerSideProps

Page.getLayout = (children) => <ProfileLayout>{children}</ProfileLayout>

export default Page
