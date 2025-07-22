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

interface PageProps {
  sendid?: number
  siteUrl: string
  openGraphData?: {
    title?: string
    description?: string
    canonicalUrl?: string
    imageUrl?: string
  }
}

export const Page: NextPageWithLayout<PageProps> = ({ sendid, siteUrl, openGraphData }) => {
  // Use OpenGraph data from getServerSideProps if available, otherwise fallback to defaults
  const pageTitle = openGraphData?.title || 'Send | Profile'
  const description = openGraphData?.description || `Check out ${sendid} on /send`
  const canonicalUrl = openGraphData?.canonicalUrl || `${siteUrl}/profile/${sendid}`
  const ogImageUrl =
    openGraphData?.imageUrl || 'https://ghassets.send.app/2024/04/send-og-image.png'

  return (
    <>
      <NextSeo
        title={pageTitle}
        description={description}
        canonical={canonicalUrl}
        openGraph={{
          type: 'profile',
          url: canonicalUrl,
          title: pageTitle,
          description: description,
          images: [
            {
              url: ogImageUrl,
              width: 1200,
              height: 630,
              alt: 'og-image',
              type: 'image/png',
            },
          ],
        }}
        twitter={{
          cardType: 'summary_large_image',
          title: pageTitle,
          description: description,
        }}
      />
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

  // Populate default OpenGraph data if needed
  const openGraphData = {
    title: `Profile of ${profile.name}`,
    description: `Learn more about ${profile.name} on Send`,
    imageUrl: profile.avatar_url || undefined,
  }

  return {
    props: {
      sendid,
      siteUrl,
      openGraphData,
    },
  }
}) satisfies GetServerSideProps

Page.getLayout = (children) => <ProfileLayout>{children}</ProfileLayout>

export default Page
