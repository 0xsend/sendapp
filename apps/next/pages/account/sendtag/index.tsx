import { NextSeo } from 'next-seo'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from '../../_app'
import { HomeLayout } from 'app/features/home/layout.web'
import { SendTagScreen } from 'app/features/account/sendtag/screen'
import { TopNav } from 'app/components/TopNav'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <NextSeo
        title="Send | Sendtags"
        description="Own your identity on Send. Register up to 5 verified tags and make them yours."
      />
      <SendTagScreen />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Sendtags" backFunction={'router'} />}>{children}</HomeLayout>
)

export default Page
