import { TopNav } from 'app/components/TopNav'
import { EarnScreen } from 'app/features/earn/screen'
import { HomeLayout } from 'app/features/home/layout.web'
import Head from 'next/head'
import type { NextPageWithLayout } from '../_app'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send | Earn</title>
      </Head>
      <EarnScreen />
    </>
  )
}

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Earn" backFunction="root" />}>{children}</HomeLayout>
)

export default Page
