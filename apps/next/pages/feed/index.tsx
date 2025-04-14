import { HomeLayout } from 'app/features/home/layout.web'
import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from '../_app'
import { TopNav } from 'app/components/TopNav'
import { ComingSoon } from 'app/components/ComingSoon'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send | Feed</title>
      </Head>
      <ComingSoon />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Community Feed" backFunction="router" />}>
    {children}
  </HomeLayout>
)

export default Page
