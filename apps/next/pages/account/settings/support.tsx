import { HomeLayout } from 'app/features/home/layout.web'
import { SettingsLayout } from 'app/features/account/settings/layout.web'
import { SupportScreen } from 'app/features/account/settings'
import Head from 'next/head'
// import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from '../../_app'
import { ButtonOption, TopNav } from 'app/components/TopNav'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Suppport</title>
        <meta name="description" content="Support" key="desc" />
      </Head>
      <SupportScreen />
    </>
  )
}

// export const getServerSideProps = userProtectedGetSSP()
export const getServerSideProps = () => {
  // just redirect to telegram support channel for now
  return {
    redirect: {
      destination: 'https://go.send.it/support',
      permanent: false,
    },
  }
}
Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Settings" button={ButtonOption.SETTINGS} />}>
    <SettingsLayout>{children}</SettingsLayout>
  </HomeLayout>
)

export default Page
