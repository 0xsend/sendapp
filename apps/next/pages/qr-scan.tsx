import { QRScreen } from 'app/features/send/screens/qrscan'
import Head from 'next/head'
import { guestOnlyGetSSP } from 'utils/guestOnly'
import type { NextPageWithLayout } from './_app'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>QRScan</title>
        <meta name="description" content="QRScan" key="desc" />
      </Head>
      <QRScreen />
    </>
  )
}

export const getServerSideProps = guestOnlyGetSSP()

export default Page
