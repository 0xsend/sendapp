import type { Database } from '@my/supabase/database.types'
import { Text } from '@my/ui'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'
import { ButtonOption, TopNav } from 'app/components/TopNav'
import { HomeLayout } from 'app/features/home/layout.web'
import { HomeScreen } from 'app/features/home/screen'
import { useUser } from 'app/utils/useUser'
import debug from 'debug'
import type { GetServerSidePropsContext } from 'next'
import Head from 'next/head'
import { logRequest } from 'utils/logRequest'
import { userOnboarded } from 'utils/userOnboarded'
import type { NextPageWithLayout } from './_app'

const log = debug('app:pages:index')

export const Page: NextPageWithLayout = () => {
  const { session } = useUser()
  return (
    <>
      <Head>
        <title>Send | Home</title>
      </Head>
      {session ? (
        <HomeLayout TopNav={<TopNav header="Home" button={ButtonOption.QR} showLogo={true} />}>
          <HomeScreen />
        </HomeLayout>
      ) : (
        <Text>Welcome Anon</Text>
      )}
    </>
  )
}
export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  setReferralCodeCookie(ctx)
  log('connecting to supabase', process.env.NEXT_PUBLIC_SUPABASE_URL)
  const supabase = createPagesServerClient<Database>(ctx)

  const {
    data: { session },
  } = await supabase.auth.getSession()

  logRequest(ctx)

  if (!session) {
    log('no session')
    return {
      props: {},
    }
  }

  const needsOnboarding = await userOnboarded(supabase, ctx)
  if (needsOnboarding) return needsOnboarding

  return {
    props: {
      initialSession: session,
    },
  }
}

function setReferralCodeCookie(context: GetServerSidePropsContext) {
  // Read the 'code' query parameter from the request URL
  const referralCode = context.query.referral

  // Set the cookie on the client side if the referral code exists
  if (referralCode) {
    context.res.setHeader(
      'Set-Cookie',
      `referral=${referralCode}; Max-Age=${30 * 24 * 60 * 60}; Path=/;` // 30 days
    )
  }
}

export default Page
