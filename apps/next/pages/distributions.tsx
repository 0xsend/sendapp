import { DistributionsScreen } from 'app/features/distributions/screen'
import Head from 'next/head'
import { HomeSideBarWrapper } from 'app/components/sidebar/HomeSideBar'
import { NextPageWithLayout } from './_app'
import { userProtectedGetSSP } from 'utils/userProtected'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Distributions</title>
        <meta
          name="description"
          content="Disributions"
          key="desc"
        />
      </Head>
      <HomeSideBarWrapper >
        <DistributionsScreen />
      </HomeSideBarWrapper>
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()

export default Page
