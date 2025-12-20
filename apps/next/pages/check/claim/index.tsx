import { CheckClaimScreen } from 'app/features/check/claim/screen'
import { NextSeo } from 'next-seo'
import type { NextPageWithLayout } from '../../_app'
import { HomeLayout } from 'app/features/home/layout.web'
import { TopNav } from 'app/components/TopNav'
import type { ReactNode } from 'react'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <NextSeo title="Claim Check | Send" description="Claim tokens from a Send Check" />
      <CheckClaimScreen />
    </>
  )
}

const CheckClaimLayout = ({ children }: { children: ReactNode }) => {
  return (
    <HomeLayout TopNav={<TopNav header="Claim Check" backFunction="pop" showBackOnDesktop />}>
      {children}
    </HomeLayout>
  )
}

Page.getLayout = (children) => <CheckClaimLayout>{children}</CheckClaimLayout>

export default Page
