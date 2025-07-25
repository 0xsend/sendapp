import { HomeLayout } from 'app/features/home/layout.web'
import { TopNav } from 'app/components/TopNav'
import { NextSeo } from 'next-seo'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from '../_app'
import { DepositCoinbaseScreen } from 'app/features/deposit/DepositCoinbase/screen'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <NextSeo title="Send | Debit Card Deposit" />
      <DepositCoinbaseScreen defaultPaymentMethod="CARD" />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Debit Card" backFunction="pop" />}>{children}</HomeLayout>
)

export default Page
