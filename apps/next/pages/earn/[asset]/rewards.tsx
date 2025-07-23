import { TopNav } from 'app/components/TopNav'
import { RewardsBalanceScreen } from 'app/features/earn/rewards/screen'
import { SendEarnProvider } from 'app/features/earn/providers/SendEarnProvider'
import { HomeLayout } from 'app/features/home/layout.web'
import { NextSeo } from 'next-seo'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from '../../_app'
import type { GetServerSideProps } from 'next'
import { assetParam } from '../../../utils/assetParam'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <NextSeo title="Send | Rewards Balance" />
      <SendEarnProvider>
        <RewardsBalanceScreen />
      </SendEarnProvider>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = (context) => {
  return assetParam(context, userProtectedGetSSP)
}

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Rewards Balance" backFunction="router" />} fullHeight>
    {children}
  </HomeLayout>
)

export default Page
