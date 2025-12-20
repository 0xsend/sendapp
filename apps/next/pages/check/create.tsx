import { CheckCreateScreen } from 'app/features/check/create/screen'
import { NextSeo } from 'next-seo'
import type { NextPageWithLayout } from '../_app'
import { HomeLayout } from 'app/features/home/layout.web'
import { TopNav } from 'app/components/TopNav'
import type { ReactNode } from 'react'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <NextSeo
        title="Create Check | Send"
        description="Send tokens to anyone, even without a Send account"
      />
      <CheckCreateScreen />
    </>
  )
}

const CheckCreateLayout = ({ children }: { children: ReactNode }) => {
  return (
    <HomeLayout TopNav={<TopNav header="Create Check" backFunction="pop" showBackOnDesktop />}>
      {children}
    </HomeLayout>
  )
}

Page.getLayout = (children) => <CheckCreateLayout>{children}</CheckCreateLayout>

export default Page
