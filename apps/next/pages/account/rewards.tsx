import { RewardsScreen } from 'app/features/account/rewards/screen'
import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from 'next-app/pages/_app'
import { HomeLayout } from 'app/features/home/layout.web'
import { ButtonOption, TopNav } from 'app/components/TopNav'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send | Send It Rewards</title>
      </Head>
      <RewardsScreen />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()

const subheader =
  'Register at least 1 Sendtag, maintain the minimum balance, avoid selling, and refer others for a bonus multiplier. '

Page.getLayout = (children) => (
  <HomeLayout
    TopNav={
      <TopNav header="Send It Rewards" subheader={subheader} button={ButtonOption.SETTINGS} />
    }
  >
    {children}
  </HomeLayout>
)

export default Page
