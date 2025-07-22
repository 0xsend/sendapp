import { TopNav } from 'app/components/TopNav'
import { CreatePasskeyScreen } from 'app/features/account/backup/create'
import { HomeLayout } from 'app/features/home/layout.web'
import { NextSeo } from 'next-seo'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from '../../_app'
import { AccountScreenLayout } from 'app/features/account/AccountScreenLayout'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <NextSeo title="Send | Create Passkey" />
      <CreatePasskeyScreen />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Account" backFunction={'pop'} />} fullHeight>
    <AccountScreenLayout>{children}</AccountScreenLayout>
  </HomeLayout>
)

export default Page
