import type { ReactNode } from 'react'
import { HomeLayout } from 'app/features/home/layout.web'
import { TopNav } from 'app/components/TopNav'
import { NextSeo } from 'next-seo'
import type { NextPageWithLayout } from '../_app'
import { BankTransferScreen } from 'app/features/deposit/bank-transfer'
import { userProtectedGetSSP } from 'utils/userProtected'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <NextSeo title="Send | Bank Transfer" />
      <BankTransferScreen />
    </>
  )
}

function BankTransferLayout({ children }: { children: ReactNode }) {
  return (
    <HomeLayout TopNav={<TopNav header="Bank Transfer" backFunction="pop" />}>
      {children}
    </HomeLayout>
  )
}

Page.getLayout = (children) => <BankTransferLayout>{children}</BankTransferLayout>

export const getServerSideProps = userProtectedGetSSP()

export default Page
