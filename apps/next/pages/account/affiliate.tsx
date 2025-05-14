import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from '../_app'
import { HomeLayout } from 'app/features/home/layout.web'
import { TopNav } from 'app/components/TopNav'
import { FriendsScreen } from '../../../../packages/app/features/affiliate/screen'
import type { GetServerSidePropsContext } from 'next'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@my/supabase/database.types'
import { createSupabaseAdminClient } from '../../../../packages/app/utils/supabase/admin'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send | Friends</title>
        <meta name="description" content="View invited friends and track activity." key="desc" />
      </Head>
      <FriendsScreen />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP(
  async (context: GetServerSidePropsContext) => {
    const supabaseAdmin = createSupabaseAdminClient()
    const supabase = createPagesServerClient<Database>(context)
    const {
      data: { session },
    } = await supabase.auth.getSession()

    let count = 0

    const { count: friendsCount } = await supabase
      .rpc('get_friends', {}, { count: 'exact', head: true })
      .select('*')

    if (friendsCount) {
      count = friendsCount
    }

    if (session?.user.id) {
      const { data: referrers } = await supabaseAdmin
        .from('referrals')
        .select('*')
        .eq('referred_id', session?.user.id)

      if (referrers && referrers.length > 0) {
        count += 1
      }
    }

    return {
      props: {
        count: count,
      },
    }
  }
)

Page.getLayout = (children) => {
  const header = children.props.count ? `Friends (${children.props.count})` : 'Friends'
  return <HomeLayout TopNav={<TopNav header={header} />}>{children}</HomeLayout>
}

export default Page
