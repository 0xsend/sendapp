import { TopNav } from 'app/components/TopNav'
import { HomeLayout } from 'app/features/home/layout.web'
import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from '../_app'
import { AccountScreenLayout } from 'app/features/account/AccountScreenLayout'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send | Account</title>
        <meta
          name="description"
          content="Sendtags simplify transactions by replacing long wallet addresses with memorable identifiers."
          key="desc"
        />
      </Head>
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()
Page.getLayout = () => (
  <HomeLayout
    TopNav={<TopNav header="Account" showOnGtLg={true} hideRightActions={true} />}
    fullHeight
  >
    <AccountScreenLayout />
  </HomeLayout>
)

export default Page
