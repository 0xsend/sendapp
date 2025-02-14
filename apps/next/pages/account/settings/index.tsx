import { HomeLayout } from 'app/features/home/layout.web'
import { SettingsLayout } from 'app/features/account/settings/layout.web'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from '../../_app'
import { TopNav } from 'app/components/TopNav'

export const Page: NextPageWithLayout = () => null

export const getServerSideProps = userProtectedGetSSP()
Page.getLayout = () => (
  <HomeLayout TopNav={<TopNav header="Settings" />} fullHeight>
    <SettingsLayout />
  </HomeLayout>
)

export default Page
