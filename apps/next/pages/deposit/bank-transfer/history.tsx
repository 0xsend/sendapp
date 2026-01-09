import type { ReactNode } from 'react'
import { HomeLayout } from 'app/features/home/layout.web'
import { TopNav } from 'app/components/TopNav'
import { NextSeo } from 'next-seo'
import type { NextPageWithLayout } from '../../_app'
import { BankTransferHistoryScreen } from 'app/features/deposit/bank-transfer'
import { userProtectedGetSSP } from 'utils/userProtected'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <NextSeo title="Send | Transfer History" />
      <BankTransferHistoryScreen />
    </>
  )
}

function BankTransferHistoryLayout({ children }: { children: ReactNode }) {
  return (
    <HomeLayout TopNav={<TopNav header="Transfer History" backFunction="pop" />}>
      {children}
    </HomeLayout>
  )
}

Page.getLayout = (children) => <BankTransferHistoryLayout>{children}</BankTransferHistoryLayout>

export const getServerSideProps = userProtectedGetSSP()

export default Page
