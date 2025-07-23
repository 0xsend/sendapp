import { ProfileScreen } from 'app/features/profile/screen'
import { NextSeo } from 'next-seo'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'
import type { NextPageWithLayout } from '../../_app'
import type { GetServerSideProps, GetServerSidePropsContext } from 'next'
import type { Database } from '@my/supabase/database.types'
import { userOnboarded } from 'utils/userOnboarded'
import { createSupabaseAdminClient } from 'app/utils/supabase/admin'
import { ProfileLayout } from 'app/features/profile/layout.web'
import { getSiteUrl } from 'utils/getSiteUrl'
import { buildSeo } from 'utils/seo'
import { generateProfileSeoData, type ProfileSeoData } from 'utils/seoHelpers'

interface PageProps {
  sendid?: number
  siteUrl: string
  profileSeoData?: {
    title: string
    description: string
    canonicalUrl: string
    imageUrl: string
  }
}

export const Page: NextPageWithLayout<PageProps> = ({ sendid, siteUrl, profileSeoData }) => {
  // Generate SEO configuration using buildSeo utility
  const seo = buildSeo({
    title: profileSeoData?.title || 'Send | Profile',
    description: profileSeoData?.description || `Check out ${sendid} on Send`,
    url: profileSeoData?.canonicalUrl || `${siteUrl}/profile/${sendid}`,
    image: profileSeoData?.imageUrl,
    type: 'profile',
  })

  return (
    <>
      <NextSeo {...seo} />
      <ProfileScreen sendid={sendid} />
    </>
  )
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
  const siteUrl = getSiteUrl()

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

  // Generate SEO data using helper functions
  const profileData: ProfileSeoData = {
    name: profile.name || undefined,
    sendid,
    avatarUrl: profile.avatar_url || undefined,
  }

  const profileSeoData = generateProfileSeoData(profileData, {
    siteUrl,
    route: `/profile/${sendid}`,
  })

  return {
    props: {
      sendid,
      siteUrl,
      profileSeoData,
    },
  }
}) satisfies GetServerSideProps

Page.getLayout = (children) => <ProfileLayout>{children}</ProfileLayout>

export default Page
