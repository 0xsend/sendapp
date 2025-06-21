import { ProfileScreen } from 'app/features/profile/screen'
import Head from 'next/head'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'
import type { NextPageWithLayout } from '../_app'
import type { GetServerSideProps, GetServerSidePropsContext } from 'next'
import type { Database } from '@my/supabase/database.types'
import { userOnboarded } from 'utils/userOnboarded'
import { SendtagSchema } from 'app/utils/zod/sendtag'
import { assert } from 'app/utils/assert'
import { createSupabaseAdminClient } from 'app/utils/supabase/admin'
import { ProfileLayout } from 'app/features/profile/layout.web'

interface PageProps {
  profile?: {
    name?: string
    tag?: string
    about?: string
    avatar_url?: string
  }
  sendid: number | null
  tag?: string
}

export const Page: NextPageWithLayout<PageProps> = ({ profile, sendid, tag }) => {
  // Generate OG image URL - prefer tag route since this is accessed via tag
  const ogImageUrl = tag ? `/api/og/${tag}` : null

  // Generate page title
  const pageTitle = profile?.tag ? `send.app/${profile.tag}` : 'Send | Profile'

  // Get site URL from environment
  const siteUrl = process.env.NEXT_PUBLIC_URL
  const defaultText = `Check out ${profile?.tag ? `/${profile.tag}` : sendid} on /send`

  // Canonical URL should point to the tag route since that's how user accessed it
  const canonicalUrl = `${siteUrl}/${tag}`

  return (
    <>
      <Head>
        <title>{pageTitle}</title>

        <meta name="description" content={profile?.about || defaultText} />
        <meta key="og:type" property="og:type" content="profile" />
        <meta key="og:title" property="og:title" content={pageTitle} />
        <meta
          key="og:description"
          property="og:description"
          content={profile?.about || defaultText}
        />
        <meta key="og:url" property="og:url" content={canonicalUrl} />
        <meta key="og:image" property="og:image" content={`${siteUrl}${ogImageUrl}`} />
        <meta key="og:image:width" property="og:image:width" content="1200" />
        <meta key="og:image:height" property="og:image:height" content="630" />
        <meta key="og:image:type" property="og:image:type" content="image/jpeg" />
        <meta key="twitter:card" name="twitter:card" content="summary_large_image" />
        <meta key="twitter:title" name="twitter:title" content={pageTitle} />
        <meta
          key="twitter:description"
          name="twitter:description"
          content={profile?.about || defaultText}
        />
        <meta key="twitter:image" name="twitter:image" content={`${siteUrl}${ogImageUrl}`} />
        <meta name="twitter:site" content={tag} />
        <link rel="canonical" href={canonicalUrl} />
      </Head>
      <ProfileScreen sendid={sendid} />
    </>
  )
}

// Profile page is not protected, but we need to look up the user profile by tag in case we have to show a 404
export const getServerSideProps = (async (ctx: GetServerSidePropsContext) => {
  const { tag: tagParam } = ctx.params ?? {}

  // ensure identifier is valid before proceeding
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

  const supabase = createPagesServerClient<Database>(ctx)
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    // not anonymous user / check if user is onboarded
    const needsOnboarding = await userOnboarded(supabase, ctx)
    if (needsOnboarding) return needsOnboarding
  }

  // check if profile exists
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

  if (profile === null || (!profile.is_public && !session)) {
    // no profile or profile is private and user is not logged in
    // return 404
    return {
      notFound: true,
    }
  }

  return {
    props: {
      profile: profile
        ? {
            name: profile.name,
            tag: profile.main_tag_name,
            about: profile.about,
            avatar_url: profile.avatar_url,
          }
        : undefined,
      sendid: profile.sendid,
      tag,
    },
  }
}) satisfies GetServerSideProps

Page.getLayout = (children) => <ProfileLayout>{children}</ProfileLayout>

export default Page
