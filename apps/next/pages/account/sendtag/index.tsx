import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from '../../_app'
import { HomeLayout } from 'app/features/home/layout.web'
import { SendTagScreen } from 'app/features/account/sendtag/screen'
import { ButtonOption, TopNav } from 'app/components/TopNav'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send | Sendtag</title>
        <meta name="description" content={subheader} key="desc" />
      </Head>
      <SendTagScreen />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()

const subheader = 'Sendtags are usernames within the Send platform. You may register up to 5.'

Page.getLayout = (children) => (
  <HomeLayout
    TopNav={<TopNav header="Sendtag" subheader={subheader} button={ButtonOption.SETTINGS} />}
  >
    {children}
  </HomeLayout>
)

export default Page
