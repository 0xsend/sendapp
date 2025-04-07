import { HomeLayout } from 'app/features/home/layout.web'
import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from '../_app'
import { TopNav } from 'app/components/TopNav'
import { PlayScreen } from 'app/features/play/screen'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send | Play</title>
      </Head>
      <PlayScreen />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Play" backFunction="router" />}>{children}</HomeLayout>
)

export default Page
