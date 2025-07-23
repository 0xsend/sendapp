import { NextSeo } from 'next-seo'
import { HomeLayout } from 'app/features/home/layout.web'
import { TopNav } from 'app/components/TopNav'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from '../_app'
import { DepositSuccessScreen } from 'app/features/deposit/success/screen'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <NextSeo title="Send | Deposit" />
      <DepositSuccessScreen />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Deposit" backFunction="home" />}>{children}</HomeLayout>
)

export default Page
