import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import { NextPageWithLayout } from '../../_app'
import { HomeLayout } from 'app/features/home/layout.web'
import { SendTagScreen } from 'app/features/account/sendtag/screen'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>/send | Sendtag</title>
        <meta
          name="description"
          content="Send Tags simplify transactions by replacing long wallet addresses with memorable identifiers."
          key="desc"
        />
      </Head>
      <SendTagScreen />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()

const subheader =
  'Sendtags are personalized names that serve as unique identifiers within the Send platform. You may register up to 5.'

Page.getLayout = (children) => (
  <HomeLayout header="Sendtag" subheader={subheader}>
    {children}
  </HomeLayout>
)

export default Page
