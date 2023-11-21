import { SendScreen } from 'app/features/send/screen'
import Head from 'next/head'
import { NextPageWithLayout } from './_app'
import { guestOnlyGetSSP } from 'utils/guestOnly'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send</title>
        <meta
          name="description"
          content="Send"
          key="desc"
        />
      </Head>
      <SendScreen />
    </>
  )
}

export const getServerSideProps = guestOnlyGetSSP()

export default Page
