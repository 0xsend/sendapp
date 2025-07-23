import { TopNav } from 'app/components/TopNav'
import { assetParam } from '../../../utils/assetParam'
import { WithdrawForm } from 'app/features/earn/withdraw/screen'
import { SendEarnProvider } from 'app/features/earn/providers/SendEarnProvider'
import { HomeLayout } from 'app/features/home/layout.web'
import type { GetServerSideProps } from 'next'
import { NextSeo } from 'next-seo'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from '../../_app'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <NextSeo title="Send | Withdraw Deposit" />
      <SendEarnProvider>
        <WithdrawForm />
      </SendEarnProvider>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = (context) => {
  return assetParam(context, userProtectedGetSSP)
}

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Withdraw Deposit" backFunction="router" />}>
    {children}
  </HomeLayout>
)

export default Page
