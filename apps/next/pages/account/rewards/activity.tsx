import { ActivityRewardsScreen } from 'app/features/account/rewards/activity/screen'
import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from 'next-app/pages/_app'
import { HomeLayout } from 'app/features/home/layout.web'
import { TopNav } from 'app/components/TopNav'
import { MobileButtonRowLayout } from 'app/components/MobileButtonRowLayout'
import { DistributionProvider } from 'app/features/account/rewards/DistributionContext'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send | Activity Rewards</title>
      </Head>
      <ActivityRewardsScreen />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()

Page.getLayout = (children) => (
  <DistributionProvider>
    <MobileButtonRowLayout.ActivityRewards>
      <HomeLayout TopNav={<TopNav header="Activity Rewards" backFunction={'pop'} />}>
        {children}
      </HomeLayout>
    </MobileButtonRowLayout.ActivityRewards>
  </DistributionProvider>
)

export default Page
