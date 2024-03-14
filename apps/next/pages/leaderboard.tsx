import { LeaderboardScreen } from 'app/features/leaderboard/screen'
import { HomeLayout } from 'app/features/home/layout.web'
import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import { NextPageWithLayout } from './_app'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>/send | Leaderboard</title>
      </Head>
      <LeaderboardScreen />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()

Page.getLayout = (children) => <HomeLayout header="Leaderboard">{children}</HomeLayout>

export default Page
