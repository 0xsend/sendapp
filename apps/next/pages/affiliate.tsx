import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from './_app'
import { AffiliateScreen } from 'app/features/affiliate/screen'
import { HomeLayout } from 'app/features/home/layout.web'
import { ButtonOption, TopNav } from 'app/components/TopNav'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send | Affiliates</title>
        <meta name="description" content="Send Affiliates" key="desc" />
      </Head>
      <AffiliateScreen />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Affiliates" />}>{children}</HomeLayout>
)

export default Page
