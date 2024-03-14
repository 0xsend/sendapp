import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import { NextPageWithLayout } from './_app'
import { ReferralsScreen } from 'app/features/referrals/screen'
import { HomeLayout } from 'app/features/home/layout.web'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>/send | Referral Rewards</title>
        <meta name="description" content="Referral Rewards" key="desc" />
      </Head>
      <ReferralsScreen />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()

Page.getLayout = (children) => <HomeLayout header="Referrals">{children}</HomeLayout>

export default Page
