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
        <title>Send | Send Rewards</title>
      </Head>
      <ActivityRewardsScreen />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()

const subheader =
  'Register at least 1 Sendtag, maintain the minimum balance, avoid selling, and refer others for a bonus multiplier. '

Page.getLayout = (children) => (
  <MobileButtonRowLayout.ActivityRewards>
    <HomeLayout
      TopNav={
        <TopNav
          header="Send Rewards"
          showLogo
          subheader={subheader}
          button={ButtonOption.PROFILE}
        />
      }
    >
      {children}
    </HomeLayout>
  </MobileButtonRowLayout.ActivityRewards>
)

export default Page
