import { TopNav } from 'app/components/TopNav'
import { HomeLayout } from 'app/features/home/layout.web'
import { NextSeo } from 'next-seo'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from '../_app'
import { AccountScreenLayout } from 'app/features/account/AccountScreenLayout'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <NextSeo
        title="Send | Account"
        description="Sendtags simplify transactions by replacing long wallet addresses with memorable identifiers."
      />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()
Page.getLayout = () => (
  <HomeLayout
    TopNav={<TopNav header="Account" showOnGtLg={true} hideRightActions={true} />}
    fullHeight
  >
    <AccountScreenLayout />
  </HomeLayout>
)

export default Page
