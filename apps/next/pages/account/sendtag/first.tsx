import { NextSeo } from 'next-seo'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from '../../_app'
import { HomeLayout } from 'app/features/home/layout.web'
import { TopNav } from 'app/components/TopNav'
import { FirstSendtagScreen } from 'app/features/account/sendtag/first/FirstSendtagScreen'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <NextSeo title="Send | First Sendtag" />
      <FirstSendtagScreen />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Sendtags" backFunction={'router'} />}>{children}</HomeLayout>
)

export default Page
