import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from '../_app'
import { AffiliateScreen } from 'app/features/affiliate/screen'
import { HomeLayout } from 'app/features/home/layout.web'
import { TopNav } from 'app/components/TopNav'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send | Affiliates</title>
        <meta
          name="description"
          content="View your network and track referral activity."
          key="desc"
        />
      </Head>
      <AffiliateScreen />
    </>
  )
}

const subheader = 'View your network and track referral activity.'

export const getServerSideProps = userProtectedGetSSP()

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Affiliate" subheader={subheader} />}>{children}</HomeLayout>
)

export default Page
