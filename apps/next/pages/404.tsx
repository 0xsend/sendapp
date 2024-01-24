import Head from 'next/head'
import { UnknownScreen } from 'app/features/unknown/screen'

export default function Page() {
  return (
    <>
      <Head>
        <title>404 | Send</title>
        <meta name="description" content="Not found. Send, Instant Payments." key="desc" />
      </Head>
      <UnknownScreen />
    </>
  )
}
