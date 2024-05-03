import Head from 'next/head'
import type { NextPageWithLayout } from './_app'
import { guestOnlyGetSSP } from 'utils/guestOnly'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send | Challenge</title>
      </Head>
    </>
  )
}

export const getServerSideProps = guestOnlyGetSSP()

export default Page
