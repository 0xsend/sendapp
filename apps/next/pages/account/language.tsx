import { HomeLayout } from 'app/features/home/layout.web'
import { NextSeo } from 'next-seo'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from '../_app'
import { TopNav } from 'app/components/TopNav'
import { AccountScreenLayout } from 'app/features/account/AccountScreenLayout'
import { LanguagePreferences } from 'app/features/account/components/language/screen'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <NextSeo title="Send | Language" description="Language preferences" />
      <LanguagePreferences />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()
Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header={'Account'} backFunction={'router'} />} fullHeight>
    <AccountScreenLayout>{children}</AccountScreenLayout>
  </HomeLayout>
)

export default Page
