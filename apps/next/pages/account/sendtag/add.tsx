import { AddSendtagsScreen } from 'app/features/account/sendtag/add/AddSendtagsScreen'
import { NextSeo } from 'next-seo'
import type { NextPageWithLayout } from '../../_app'
import { HomeLayout } from 'app/features/home/layout.web'
import { TopNav } from 'app/components/TopNav'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <NextSeo title="Send | Add Sendtags" />
      <AddSendtagsScreen />
    </>
  )
}

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Sendtags" backFunction={'router'} />}>{children}</HomeLayout>
)

export default Page
