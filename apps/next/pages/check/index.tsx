import { CheckScreen } from 'app/features/check/screen'
import { NextSeo } from 'next-seo'
import type { NextPageWithLayout } from '../_app'
import { HomeLayout } from 'app/features/home/layout.web'
import { TopNav } from 'app/components/TopNav'
import type { ReactNode } from 'react'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <NextSeo title="My Checks | Send" description="View and manage your Send Checks" />
      <CheckScreen />
    </>
  )
}

const CheckLayout = ({ children }: { children: ReactNode }) => {
  return (
    <HomeLayout TopNav={<TopNav header="My Checks" backFunction="router" />}>{children}</HomeLayout>
  )
}

Page.getLayout = (children) => <CheckLayout>{children}</CheckLayout>

export default Page
