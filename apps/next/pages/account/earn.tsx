import { EarnTokensScreen } from 'app/features/account/earn-tokens/screen'
import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import { NextPageWithLayout } from 'next-app/pages/_app'
import { HomeLayout } from 'app/features/home/layout.web'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send | Hold & Earn</title>
      </Head>
      <EarnTokensScreen />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()

Page.getLayout = (children) => (
  <HomeLayout
    header="Hold & Earn"
    subheader="Maintain the minimum balance, avoid selling, and refer others for a bonus multiplier. "
  >
    {children}
  </HomeLayout>
)

export default Page
