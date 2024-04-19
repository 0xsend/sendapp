import { ReceiveScreen } from 'app/features/send/screens/receive'
import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from './_app'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send | Receive</title>
        <meta name="description" content="Receive" key="desc" />
      </Head>
      <ReceiveScreen />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP(async () => {
  // disable for now
  return { redirect: { destination: '/', permanent: false } }
})

export default Page
