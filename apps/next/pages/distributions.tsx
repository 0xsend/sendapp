import { DistributionsScreen } from 'app/features/distributions/screen'
import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import { NextPageWithLayout } from './_app'
import { HomeLayout } from 'app/features/home/layout.web'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send | Distributions</title>
      </Head>
      <DistributionsScreen />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()

Page.getLayout = (children) => <HomeLayout header="Distributions">{children}</HomeLayout>

export default Page
