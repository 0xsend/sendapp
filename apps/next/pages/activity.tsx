import { ActivityScreen } from 'app/features/activity/screen'
import { HomeLayout } from 'app/features/home/layout.web'
import { NextSeo } from 'next-seo'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from './_app'
import { TopNav } from 'app/components/TopNav'
import { PAGE_TITLES, PAGE_DESCRIPTIONS } from 'utils/seoHelpers'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <NextSeo title={PAGE_TITLES.activity} description={PAGE_DESCRIPTIONS.activity} />
      <ActivityScreen />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Activity" showOnGtLg={true} />}>{children}</HomeLayout>
)

export default Page
