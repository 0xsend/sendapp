import { ProfileScreen } from 'app/features/profile/screen'
import { HomeLayout } from 'app/features/home/layout.web'
import Head from 'next/head'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'
import { NextPageWithLayout } from '../_app'
import { GetServerSideProps, GetServerSidePropsContext } from 'next'
import { Database } from '@my/supabase/database.types'
import { userOnboarded } from 'utils/userOnboarded'
import { CheckoutTagSchema } from 'app/features/account/sendtag/checkout/CheckoutTagSchema'
import { assert } from 'app/utils/assert'
import { supabaseAdmin } from 'app/utils/supabase/admin'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>/send | Profile</title>
      </Head>
      <ProfileScreen />
    </>
  )
}

// Profile page is not protected, but we need to look up the user profile by tag in case we have to show a 404
export const getServerSideProps = (async (ctx: GetServerSidePropsContext) => {
  const { tag } = ctx.params ?? {}

  // ensure tag is valid before proceeding
  const { success } = CheckoutTagSchema.safeParse({ name: tag })
  if (!success) {
    return {
      notFound: true,
    }
  }
  assert(!!tag, 'Tag is required')
  assert(typeof tag === 'string', 'Tag must be a string')

  // log user activity
  console.log(
    `${ctx.req.url} - ${ctx.req.headers['user-agent']}${
      ctx.req.headers['x-forwarded-for'] ? ` - ${ctx.req.headers['x-forwarded-for']}` : ''
    }`
  )

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
  const { data: profile, error } = await supabaseAdmin.rpc('profile_lookup', { tag }).maybeSingle()

  if (error) {
    console.error('Error fetching tag', error)
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
    props: {},
  }
}) satisfies GetServerSideProps

Page.getLayout = (children) => <HomeLayout header="">{children}</HomeLayout>

export default Page
