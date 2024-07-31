import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from './_app'
import { ReferralsScreen } from 'app/features/referrals/screen'
import { HomeLayout } from 'app/features/home/layout.web'
import { ButtonOption, TopNav } from 'app/components/TopNav'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send | Referral Rewards</title>
        <meta name="description" content="Referral Rewards" key="desc" />
      </Head>
      <ReferralsScreen />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Referrals" button={ButtonOption.PROFILE} />}>
    {children}
  </HomeLayout>
)

export default Page
