import { LeaderboardScreen } from 'app/features/leaderboard/screen'
import { HomeLayout } from 'app/features/home/layout.web'
import { NextSeo } from 'next-seo'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from './_app'
import { TopNav } from 'app/components/TopNav'
import { PAGE_TITLES, PAGE_DESCRIPTIONS } from 'utils/seoHelpers'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <NextSeo title={PAGE_TITLES.leaderboard} description={PAGE_DESCRIPTIONS.leaderboard} />
      <LeaderboardScreen />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Leaderboard" backFunction="router" />}>{children}</HomeLayout>
)

export default Page
