import { HomeLayout } from 'app/features/home/layout.web'
import { TopNav } from 'app/components/TopNav'
import { NextSeo } from 'next-seo'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from '../_app'
import { DepositCryptoScreen } from 'app/features/deposit/crypto/screen'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <NextSeo title="Send | Crypto Deposit" />
      <DepositCryptoScreen />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Deposit on Base" backFunction="pop" />}>
    {children}
  </HomeLayout>
)

export default Page
