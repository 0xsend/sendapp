import { HomeLayout } from 'app/features/home/layout.web'
import { ConfirmPasskeyScreen } from 'app/features/account/backup/confirm'
import { NextSeo } from 'next-seo'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from '../../../_app'
import { TopNav } from 'app/components/TopNav'
import { AccountScreenLayout } from 'app/features/account/AccountScreenLayout'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <NextSeo title="Send | Confirm Passkey" />
      <ConfirmPasskeyScreen />
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
