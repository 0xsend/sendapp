import { HomeLayout } from 'app/features/home/layout.web'
import { SettingsLayout } from 'app/features/account/layout.web'
import { PersonalInfoScreen } from 'app/features/account/settings'
import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import { NextPageWithLayout } from '../../_app'
import { useMedia } from '@my/ui'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Personal Information</title>
        <meta name="description" content="Personal Information" key="desc" />
      </Head>
      <PersonalInfoScreen />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()
Page.getLayout = (children) => {
  const media = useMedia()
  return (
    <HomeLayout header={media.lg ? 'Personal Information' : 'Settings'} backLink={'/account'}>
      <SettingsLayout>{children}</SettingsLayout>
    </HomeLayout>
  )
}

export default Page
