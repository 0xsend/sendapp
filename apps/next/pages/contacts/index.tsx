import { HomeLayout } from 'app/features/home/layout.web'
import { NextSeo } from 'next-seo'
import type { NextPageWithLayout } from '../_app'
import { TopNav } from 'app/components/TopNav'
import { ContactsScreen } from 'app/features/contacts/screen'
import { PAGE_TITLES, PAGE_DESCRIPTIONS } from 'utils/seoHelpers'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <NextSeo title={PAGE_TITLES.contacts} description={PAGE_DESCRIPTIONS.contacts} />
      <ContactsScreen />
    </>
  )
}

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Contacts" backFunction="router" showOnGtLg={true} />}>
    {children}
  </HomeLayout>
)

export default Page
