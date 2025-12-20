import { CheckClaimPreviewScreen } from 'app/features/check/claim/preview'
import { NextSeo } from 'next-seo'
import type { NextPageWithLayout } from '../../_app'
import { HomeLayout } from 'app/features/home/layout.web'
import { TopNav } from 'app/components/TopNav'
import type { ReactNode } from 'react'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <NextSeo title="Claim Check | Send" description="Preview and claim your Send Check" />
      <CheckClaimPreviewScreen />
    </>
  )
}

const CheckClaimPreviewLayout = ({ children }: { children: ReactNode }) => {
  return (
    <HomeLayout TopNav={<TopNav header="Claim Check" backFunction="pop" showBackOnDesktop />}>
      {children}
    </HomeLayout>
  )
}

Page.getLayout = (children) => <CheckClaimPreviewLayout>{children}</CheckClaimPreviewLayout>

export default Page
