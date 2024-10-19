import { ActivityRewardsScreen } from 'app/features/account/rewards/activity/screen'
import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from 'next-app/pages/_app'
import { HomeLayout } from 'app/features/home/layout.web'
import { ButtonOption, TopNav } from 'app/components/TopNav'
import { MobileButtonRowLayout } from 'app/components/MobileButtonRowLayout'

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
  <MobileButtonRowLayout.ActivityRewards>
    <HomeLayout
      TopNav={<TopNav header="Activity Rewards" showLogo button={ButtonOption.PROFILE} />}
    >
      {children}
    </HomeLayout>
  </MobileButtonRowLayout.ActivityRewards>
)

export default Page
