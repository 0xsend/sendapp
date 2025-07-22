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
import {
  generateProfileOpenGraphData,
  type ProfileOpenGraphData,
} from 'utils/generateProfileOpenGraphData'
import { getSiteUrl } from 'utils/getSiteUrl'
import { buildSeo } from 'utils/seo'

interface PageProps {
  sendid: number | null
  tag?: string
  siteUrl: string
  openGraphData?: ProfileOpenGraphData
}

export const Page: NextPageWithLayout<PageProps> = ({ sendid, tag, siteUrl, openGraphData }) => {
  // Use OpenGraph data from getServerSideProps if available, otherwise fallback to defaults
  const seo = buildSeo({
    title: openGraphData?.title ?? 'Send | Profile',
    description: openGraphData?.description ?? `Check out ${tag ? `/${tag}` : sendid} on Send`,
    url: openGraphData?.canonicalUrl ?? `${siteUrl}/${tag}`,
    image: openGraphData?.imageUrl ?? 'https://ghassets.send.app/2024/04/send-og-image.png',
  })

  return (
    <>
      {seo && <NextSeo {...seo} />}
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

  // Generate OpenGraph data server-side
  let openGraphData: ProfileOpenGraphData | undefined
  try {
    openGraphData = await generateProfileOpenGraphData(profile, siteUrl, `/${tag}`)
  } catch (error) {
    console.error('Error generating OpenGraph data:', error)
    // Continue without OpenGraph data if generation fails
  }

  return {
    props: {
      sendid: profile.sendid,
      tag,
      siteUrl,
      openGraphData,
    },
  }
}) satisfies GetServerSideProps

Page.getLayout = (children) => <ProfileLayout>{children}</ProfileLayout>

export default Page
