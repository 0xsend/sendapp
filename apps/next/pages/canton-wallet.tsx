import { HomeLayout } from 'app/features/home/layout.web'
import { NextSeo } from 'next-seo'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from './_app'
import { TopNav } from 'app/components/TopNav'
import { CantonWalletScreen } from 'app/features/canton-wallet/screen'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <NextSeo title="Send | Explore Canton Wallet" />
      <CantonWalletScreen />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()

Page.getLayout = (children) => (
  <HomeLayout
    TopNav={<TopNav header="Explore Canton Wallet" backFunction="pop" showOnGtLg={true} />}
  >
    {children}
  </HomeLayout>
)

export default Page
