import { SendScreen } from 'app/features/send/screens/send'
import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import { NextPageWithLayout } from './_app'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>/send</title>
        <meta name="description" content="Send" key="desc" />
      </Head>
      <SendScreen />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()

export default Page
