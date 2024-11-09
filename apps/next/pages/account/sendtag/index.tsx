import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from '../../_app'
import { HomeLayout } from 'app/features/home/layout.web'
import { SendTagScreen } from 'app/features/account/sendtag/screen'
import { TopNav } from 'app/components/TopNav'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send | Sendtags</title>
        <meta name="description" content={subheader} key="desc" />
      </Head>
      <SendTagScreen />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()

const subheader = 'Sendtags are usernames within the Send platform. You may register up to 5.'

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Sendtags" subheader={subheader} />}>{children}</HomeLayout>
)

export default Page
