import { ProfileScreen } from 'app/features/profile/screen'
import { HomeLayout } from 'app/features/home/layout.web'
import Head from 'next/head'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'
import type { NextPageWithLayout } from './_app'
import type { GetServerSideProps, GetServerSidePropsContext } from 'next'
import type { Database } from '@my/supabase/database.types'
import { userOnboarded } from 'utils/userOnboarded'
import { CheckoutTagSchema } from 'app/features/account/sendtag/checkout/CheckoutTagSchema'
import { assert } from 'app/utils/assert'
import { supabaseAdmin } from 'app/utils/supabase/admin'
import { TopNav } from 'app/components/TopNav'

export const Page: NextPageWithLayout<{ sendid: string }> = ({ sendid }) => {
  return (
    <>
      <Head>
        <title>Send | Profile</title>
      </Head>
      <ProfileScreen sendid={sendid} />
    </>
  )
}

// Profile page is not protected, but we need to look up the user profile by tag in case we have to show a 404
export const getServerSideProps = (async (ctx: GetServerSidePropsContext) => {
  const { tag: tagParam } = ctx.params ?? {}

  // ensure identifier is valid before proceeding
  const result = CheckoutTagSchema.safeParse({
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
      sendid: profile.sendid,
    },
  }
}) satisfies GetServerSideProps

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Profile" noSubroute />}>{children}</HomeLayout>
)

export default Page
