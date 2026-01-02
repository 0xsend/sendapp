import { HomeLayout } from 'app/features/home/layout.web'
import Head from 'next/head'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'
import type { NextPageWithLayout } from '../../_app'
import type { GetServerSideProps, GetServerSidePropsContext } from 'next'
import type { Database } from '@my/supabase/database.types'
import { userOnboarded } from 'utils/userOnboarded'
import { createSupabaseAdminClient } from 'app/utils/supabase/admin'
import { ProfileHistoryScreen } from 'app/features/profile/history/screen'
import { ExternalAddressHistoryScreen } from 'app/features/profile/history/ExternalAddressHistoryScreen'
import { TopNav } from 'app/components/TopNav'
import { isAddress, type Address } from 'viem'

interface PageProps {
  address?: Address
  isExternalAddress?: boolean
}

export const Page: NextPageWithLayout<PageProps> = ({ address, isExternalAddress }) => {
  if (isExternalAddress && address) {
    return (
      <>
        <Head>
          <title>Send | Address History</title>
        </Head>
        <ExternalAddressHistoryScreen address={address} />
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Send | Profile History</title>
      </Head>
      <ProfileHistoryScreen />
    </>
  )
}

// Profile page is not protected, but we need to look up the user profile by tag in case we have to show a 404
export const getServerSideProps = (async (ctx: GetServerSidePropsContext) => {
  const { sendid: sendidParam } = ctx.params ?? {}
  const identifier = sendidParam as string

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
      // Address has a Send account - redirect to canonical history URL
      const redirectUrl = `/profile/${profile.sendid}/history`
      return { redirect: { destination: redirectUrl, permanent: false } }
    }

    // No Send account - render external address history view
    return {
      props: {
        address: identifier,
        isExternalAddress: true,
      },
    }
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

  return {
    props: {},
  }
}) satisfies GetServerSideProps

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="History" backFunction="router" />} fullHeight>
    {children}
  </HomeLayout>
)

export default Page
