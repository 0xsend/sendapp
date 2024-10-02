import { LockAndEarnScreen } from 'app/features/account/rewards/lock-and-earn/screen'
import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from 'next-app/pages/_app'
import { HomeLayout } from 'app/features/home/layout.web'
import { ButtonOption, TopNav } from 'app/components/TopNav'
import { MobileButtonRowLayout } from 'app/components/MobileButtonRowLayout'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send | Lock and Earn</title>
      </Head>
      <LockAndEarnScreen />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()
Page.getLayout = (children) => (
  <MobileButtonRowLayout.LockAndEarn>
    <HomeLayout TopNav={<TopNav header="Lock and Earn" button={ButtonOption.PROFILE} />}>
      {children}
    </HomeLayout>
  </MobileButtonRowLayout.LockAndEarn>
)

export default Page
