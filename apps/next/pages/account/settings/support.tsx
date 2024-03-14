import { HomeLayout } from 'app/features/home/layout.web'
import { SettingsLayout } from 'app/features/account/layout.web'
import { SupportScreen } from 'app/features/account/settings/support'
import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import { NextPageWithLayout } from '../../_app'
import { useMedia } from '@my/ui'

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

export const getServerSideProps = userProtectedGetSSP()
Page.getLayout = (children) => {
  const media = useMedia()
  return (
    <HomeLayout header={media.lg ? 'Support' : 'Settings'} backLink={'/account'}>
      <SettingsLayout>{children}</SettingsLayout>
    </HomeLayout>
  )
}

export default Page
