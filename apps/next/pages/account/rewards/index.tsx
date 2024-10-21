import { RewardsScreen } from 'app/features/account/rewards/screen'
import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from 'next-app/pages/_app'
import { HomeLayout } from 'app/features/home/layout.web'
import { TopNav } from 'app/components/TopNav'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send | Send Rewards</title>
      </Head>
      <RewardsScreen />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()
Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Rewards" />}>{children}</HomeLayout>
)

export default Page
