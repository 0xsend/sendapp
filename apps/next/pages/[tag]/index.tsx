import { ProfileScreen } from 'app/features/profile/screen'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'
import type { NextPageWithLayout } from '../_app'
import type { GetServerSideProps, GetServerSidePropsContext } from 'next'
import type { Database } from '@my/supabase/database.types'
import { userOnboarded } from 'utils/userOnboarded'
import { SendtagSchema } from 'app/utils/zod/sendtag'
import { assert } from 'app/utils/assert'
import { createSupabaseAdminClient } from 'app/utils/supabase/admin'
import { HomeLayout } from 'app/features/home/layout.web'
import { buildSeo } from 'utils/seo'
import { generateProfileSeoData, type ProfileSeoData } from 'utils/seoHelpers'
import { useEffect } from 'react'
import { useUser } from 'app/utils/useUser'
import { useSetReferralCode } from 'app/utils/useReferralCode'

import { ProfileTopNav } from 'app/components/ProfileTopNav'

interface PageProps {
  sendid: number | null
  seo: ReturnType<typeof buildSeo>
  resolvedTag?: string
}

export const Page: NextPageWithLayout<PageProps> = ({ sendid, resolvedTag }) => {
  const { session } = useUser()
  const { mutateAsync: setReferralCodeMutateAsync } = useSetReferralCode()

  useEffect(() => {
    if (!session && resolvedTag) {
      void setReferralCodeMutateAsync(resolvedTag)
    }
  }, [session, resolvedTag, setReferralCodeMutateAsync])

  return <ProfileScreen sendid={sendid} />
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
  const siteUrl = process.env.NEXT_PUBLIC_URL || 'https://send.app'

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
    all_tags: profile.all_tags,
    tag: profile.main_tag_name || tag,
    about: profile.about || undefined,
    avatarUrl: profile.avatar_url || undefined,
    bannerUrl: profile.banner_url || undefined,
  }

  const profileSeoData = generateProfileSeoData(profileData, {
    siteUrl,
    route: `/${tag}`,
  })

  // Generate SEO configuration server-side
  const seo = buildSeo({
    title: profileSeoData?.title ?? 'Send | Profile',
    description:
      profileSeoData?.description ?? `Check out ${tag ? `/${tag}` : profile.sendid} on Send`,
    url: profileSeoData?.canonicalUrl ?? `${siteUrl}/${tag}`,
    image: profileSeoData?.imageUrl,
    type: 'profile',
  })

  return {
    props: {
      sendid: profile.sendid,
      seo,
      resolvedTag: tag,
    },
  }
}) satisfies GetServerSideProps

Page.getLayout = (children) => <HomeLayout TopNav={<ProfileTopNav />}>{children}</HomeLayout>

export default Page
