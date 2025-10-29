import { SecretShopScreen } from 'app/features/secret-shop/screen'
import { HomeLayout } from 'app/features/home/layout.web'
import { NextSeo } from 'next-seo'
import type { NextPageWithLayout } from './_app'
import { TopNav } from 'app/components/TopNav'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <NextSeo title="Send | Secret Shop" />
      <SecretShopScreen />
    </>
  )
}

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Secret Shop" backFunction="home" />}>{children}</HomeLayout>
)

export default Page
