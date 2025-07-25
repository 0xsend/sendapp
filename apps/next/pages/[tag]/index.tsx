import { ProfileScreen } from 'app/features/profile/screen'
import { NextSeo } from 'next-seo'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'
import type { NextPageWithLayout } from '../_app'
import type { GetServerSideProps, GetServerSidePropsContext } from 'next'
import type { Database } from '@my/supabase/database.types'
import { userOnboarded } from 'utils/userOnboarded'
import { SendtagSchema } from 'app/utils/zod/sendtag'
import { assert } from 'app/utils/assert'
import { createSupabaseAdminClient } from 'app/utils/supabase/admin'
import { ProfileLayout } from 'app/features/profile/layout.web'
import { getSiteUrl } from 'utils/getSiteUrl'
import { buildSeo } from 'utils/seo'
import { generateProfileSeoData, type ProfileSeoData } from 'utils/seoHelpers'

interface PageProps {
  sendid: number | null
  tag?: string
  siteUrl: string
  profileSeoData?: {
    title: string
    description: string
    canonicalUrl: string
    imageUrl: string
  }
}

export const Page: NextPageWithLayout<PageProps> = ({ sendid, tag, siteUrl, profileSeoData }) => {
  // Generate SEO configuration using buildSeo utility with consistent fallbacks
  const seo = buildSeo({
    title: profileSeoData?.title ?? 'Send | Profile',
    description: profileSeoData?.description ?? `Check out ${tag ? `/${tag}` : sendid} on Send`,
    url: profileSeoData?.canonicalUrl ?? `${siteUrl}/${tag}`,
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
  const { tag: tagParam } = ctx.params ?? {}

  const result = SendtagSchema.safeParse({
    name: tagParam?.toString().match(/^@/) ? tagParam.toString().slice(1) : tagParam,
  })

  if (!result.success) {
    return {
      notFound: true,
    }
  }

  const { name: tag } = result.data

  assert(!!tag, 'tag is required')
  assert(typeof tag === 'string', 'Identifier tag must be a string')

  // Get site URL securely using Vercel environment variables
  const siteUrl = getSiteUrl()

  const supabase = createPagesServerClient<Database>(ctx)
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    // not anonymous user / check if user is onboarded
    const needsOnboarding = await userOnboarded(supabase, ctx)
    if (needsOnboarding) return needsOnboarding
  }

  // Use profile_lookup to check existence and get full profile data in one call
  const supabaseAdmin = createSupabaseAdminClient()
  const { data: profile, error } = await supabaseAdmin
    .rpc('profile_lookup', {
      lookup_type: 'tag',
      identifier: tag,
    })
    .maybeSingle()

  if (error) {
    console.error('Error fetching profile from tag', error)
    throw error
  }

  if (profile === null) {
    // profile doesn't exist, redirect to onboarding
    console.log(`Profile not found for tag: ${tag}, redirecting to onboarding`)
    return {
      redirect: {
        destination: `/auth/sign-up?tag=${encodeURIComponent(tag)}`,
        permanent: false,
      },
    }
  }

  if (!profile.is_public && !session) {
    // profile is private and user is not logged in
    // return 404
    return {
      notFound: true,
    }
  }

  // Generate SEO data using helper functions for consistency
  const profileData: ProfileSeoData = {
    name: profile.name || undefined,
    sendid: profile.sendid ?? undefined,
    tag: profile.main_tag_name || tag,
    about: profile.about || undefined,
    avatarUrl: profile.avatar_url || undefined,
  }

  const profileSeoData = generateProfileSeoData(profileData, {
    siteUrl,
    route: `/${tag}`,
  })

  return {
    props: {
      sendid: profile.sendid,
      tag,
      siteUrl,
      profileSeoData,
    },
  }
}) satisfies GetServerSideProps

Page.getLayout = (children) => <ProfileLayout>{children}</ProfileLayout>

export default Page
