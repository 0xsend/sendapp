import { CheckoutScreen } from 'app/features/account/sendtag/checkout/screen'
import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import { NextPageWithLayout } from '../../_app'
import { HomeLayout } from 'app/features/home/layout.web'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>/send | Tag Checkout</title>
        <meta
          name="description"
          content="Send Tags simplify transactions by replacing long wallet addresses with memorable identifiers."
          key="desc"
        />
      </Head>
      <CheckoutScreen />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()

Page.getLayout = (children) => <HomeLayout header="Sendtags">{children}</HomeLayout>

export default Page
