import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import { NextPageWithLayout } from '../../_app'
import { HomeLayout } from 'app/features/home/layout.web'
import { SendTagScreen } from 'app/features/account/sendtag/screen'
import { ButtonOption, TopNav } from 'app/components/TopNav'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>/send | Sendtag</title>
        <meta name="description" content={subheader} key="desc" />
      </Head>
      <SendTagScreen />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()

const subheader =
  'Sendtags are personalized names that serve as unique identifiers within the Send platform. You may register up to 5.'

Page.getLayout = (children) => (
  <HomeLayout
    TopNav={<TopNav header="Sendtag" subheader={subheader} button={ButtonOption.SETTINGS} />}
  >
    {children}
  </HomeLayout>
)

export default Page
