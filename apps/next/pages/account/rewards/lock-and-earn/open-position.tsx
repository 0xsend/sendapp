import { OpenPosition } from 'app/features/account/rewards/lock-and-earn/open-position/screen'
import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from 'next-app/pages/_app'
import { HomeLayout } from 'app/features/home/layout.web'
import { ButtonOption, TopNav } from 'app/components/TopNav'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send | Open a Position</title>
      </Head>
      <OpenPosition />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()
Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Lock and Earn" button={ButtonOption.PROFILE} />}>
    {children}
  </HomeLayout>
)

export default Page
