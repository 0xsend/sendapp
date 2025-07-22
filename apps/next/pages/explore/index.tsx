import { HomeLayout } from 'app/features/home/layout.web'
import { NextSeo } from 'next-seo'
import type { NextPageWithLayout } from '../_app'
import { TopNav } from 'app/components/TopNav'
import { ExploreScreen } from 'app/features/explore/screen'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <NextSeo title="Send | Explore" />
      <ExploreScreen
        images={{
          rewards: 'https://ghassets.send.app/app_images/explore_rewards.jpg',
          sendpot: 'https://ghassets.send.app/app_images/sendpot.jpg',
        }}
      />
    </>
  )
}

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Explore" backFunction="router" showOnGtLg={true} />}>
    {children}
  </HomeLayout>
)

export default Page
