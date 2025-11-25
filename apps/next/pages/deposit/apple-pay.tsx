import type { ReactNode } from 'react'
import { HomeLayout } from 'app/features/home/layout.web'
import { TopNav } from 'app/components/TopNav'
import Head from 'next/head'
import type { NextPageWithLayout } from '../_app'
import { DepositCoinbaseScreen } from 'app/features/deposit/DepositCoinbase/screen'
import { useTranslation } from 'react-i18next'

export const Page: NextPageWithLayout = () => {
  const { t } = useTranslation('navigation')
  const applePayTitle = t('stack.deposit.applePay')

  return (
    <>
      <Head>
        <title>{`Send | ${applePayTitle}`}</title>
      </Head>
      <DepositCoinbaseScreen defaultPaymentMethod="APPLE_PAY" />
    </>
  )
}

function ApplePayLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation('navigation')

  return (
    <HomeLayout TopNav={<TopNav header={t('stack.deposit.applePay')} backFunction="pop" />}>
      {children}
    </HomeLayout>
  )
}

Page.getLayout = (children) => <ApplePayLayout>{children}</ApplePayLayout>

export default Page
