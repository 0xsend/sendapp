import { TopNav } from 'app/components/TopNav'
import { EarningsBalance } from 'app/features/earn/earnings/screen'
import { SendEarnProvider } from 'app/features/earn/providers/SendEarnProvider'
import { assetParam } from '../../../utils/assetParam'
import { HomeLayout } from 'app/features/home/layout.web'
import type { GetServerSideProps } from 'next'
import { NextSeo } from 'next-seo'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from '../../_app'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <NextSeo title="Send | Earnings Balance" />
      <SendEarnProvider>
        <EarningsBalance />
      </SendEarnProvider>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = (context) => {
  return assetParam(context, userProtectedGetSSP)
}

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Earnings Balance" backFunction="router" />} fullHeight>
    {children}
  </HomeLayout>
)

export default Page
