import { HomeLayout } from 'app/features/home/layout.web'
import { NextSeo } from 'next-seo'
import type { NextPageWithLayout } from '../_app'
import { TopNav } from 'app/components/TopNav'
import { AccountScreenLayout } from 'app/features/account/AccountScreenLayout'
import { EditProfile } from 'app/features/account/components/editProfile/screen'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <NextSeo title="Send | Edit Profile" description="Edit Profile" />
      <EditProfile />
    </>
  )
}

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header={'Account'} backFunction={'router'} />} fullHeight>
    <AccountScreenLayout>{children}</AccountScreenLayout>
  </HomeLayout>
)

export default Page
