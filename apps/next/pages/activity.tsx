import { ActivityScreen } from 'app/features/activity/screen'
import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import { NextPageWithLayout } from './_app'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send | Activity</title>
      </Head>
      <ActivityScreen />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()
export default Page
