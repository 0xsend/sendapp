import { SendConfirmScreen } from 'app/features/send/confirm/screen'
import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from '../_app'
import { HomeLayout } from 'app/features/home/layout.web'
import { TopNav } from 'app/components/TopNav'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send | Confirm</title>
        <meta name="description" content="Send" key="desc" />
      </Head>
      <SendConfirmScreen />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Preview and Send" />}>{children}</HomeLayout>
)

export default Page
