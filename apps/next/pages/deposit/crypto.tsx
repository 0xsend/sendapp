import { DepositAddress } from 'app/features/deposit/components/DepositAddress'
import { HomeLayout } from 'app/features/home/layout.web'
import { useSendAccount } from 'app/utils/send-accounts'
import { TopNav } from 'app/components/TopNav'
import { YStack } from '@my/ui'
import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from '../_app'

export const Page: NextPageWithLayout = () => {
  const { data: sendAccount } = useSendAccount()

  return (
    <>
      <Head>
        <title>Send | Crypto Deposit</title>
      </Head>
      <YStack width="100%" ai="center">
        <DepositAddress address={sendAccount?.address} />
      </YStack>
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Deposit" backFunction="pop" />}>{children}</HomeLayout>
)

export default Page
