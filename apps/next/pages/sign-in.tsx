import { SignInScreen } from 'app/features/auth/sign-in-screen'
import Head from 'next/head'
import { guestOnlyGetSSP } from 'utils/guestOnly'
import { NextPageWithLayout } from './_app'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send</title>
        <meta
          name="description"
          content="Send Tags simplify transactions by replacing long wallet addresses with memorable identifiers."
          key="desc"
        />
      </Head>
      <SignInScreen />
    </>
  )
}

export const getServerSideProps = guestOnlyGetSSP()

export default Page
