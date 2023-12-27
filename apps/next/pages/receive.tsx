import { ReceiveScreen } from 'app/features/send/screens/receive'
import Head from 'next/head'
import { NextPageWithLayout } from './_app'
import { guestOnlyGetSSP } from 'utils/guestOnly'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Receive</title>
        <meta
          name="description"
          content="Receive"
          key="desc"
        />
      </Head>
      <ReceiveScreen />
    </>
  )
}

export const getServerSideProps = guestOnlyGetSSP()

export default Page
