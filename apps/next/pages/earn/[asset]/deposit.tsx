import { TopNav } from 'app/components/TopNav'
import { DepositScreen } from 'app/features/earn/deposit/screen'
import { SendEarnProvider } from 'app/features/earn/providers/SendEarnProvider'
import { assetParam } from '../../../utils/assetParam'
import { HomeLayout } from 'app/features/home/layout.web'
import type { GetServerSideProps } from 'next'
import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from '../../_app'
import { useTranslation } from 'react-i18next'
import type { ReactNode } from 'react'

export const Page: NextPageWithLayout = () => {
  const { t } = useTranslation('navigation')
  const title = t('stack.earn.deposit')

  return (
    <>
      <Head>
        <title>{`Send | ${title}`}</title>
      </Head>
      <SendEarnProvider>
        <DepositScreen />
      </SendEarnProvider>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = (context) => {
  return assetParam(context, userProtectedGetSSP)
}

function EarnDepositLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation('navigation')

  return (
    <HomeLayout TopNav={<TopNav header={t('stack.earn.deposit')} backFunction="router" />}>
      {children}
    </HomeLayout>
  )
}

Page.getLayout = (children) => <EarnDepositLayout>{children}</EarnDepositLayout>

export default Page
