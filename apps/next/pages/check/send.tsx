import { CheckSendScreen } from 'app/features/check/send/screen'
import { NextSeo } from 'next-seo'
import type { NextPageWithLayout } from '../_app'
import { HomeLayout } from 'app/features/home/layout.web'
import { TopNav } from 'app/components/TopNav'
import type { ReactNode } from 'react'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <NextSeo
        title="Send Check | Send"
        description="Send tokens to anyone, even without a Send account"
      />
      <CheckSendScreen />
    </>
  )
}

const CheckSendLayout = ({ children }: { children: ReactNode }) => {
  return (
    <HomeLayout TopNav={<TopNav header="Send Check" backFunction="pop" showBackOnDesktop />}>
      {children}
    </HomeLayout>
  )
}

Page.getLayout = (children) => <CheckSendLayout>{children}</CheckSendLayout>

export default Page
