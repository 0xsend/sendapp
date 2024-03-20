import { EarnTokensScreen } from 'app/features/account/earn-tokens/screen'
import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import { NextPageWithLayout } from 'next-app/pages/_app'
import { HomeLayout } from 'app/features/home/layout.web'
import { AccountTopNav } from 'app/features/account/AccountTopNav'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>/send | Hold & Earn</title>
      </Head>
      <EarnTokensScreen />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()

const subheader =
  'Register at least 1 Sendtag, maintain the minimum balance, avoid selling, and refer others for a bonus multiplier. '

Page.getLayout = (children) => (
  <HomeLayout header="Hold & Earn" subheader={subheader} TopNav={AccountTopNav}>
    {children}
  </HomeLayout>
)

export default Page
