import { CheckoutScreen } from 'app/features/checkout/screen'
import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import { NextPageWithLayout } from './_app'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send Tag Checkout</title>
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

export default Page
