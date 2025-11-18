import type { ReactNode } from 'react'
import { HomeLayout } from 'app/features/home/layout.web'
import { TopNav } from 'app/components/TopNav'
import { NextSeo } from 'next-seo'
import type { NextPageWithLayout } from '../_app'
import { DepositCoinbaseScreen } from 'app/features/deposit/DepositCoinbase/screen'
import { useTranslation } from 'react-i18next'

export const Page: NextPageWithLayout = () => {
  const { t } = useTranslation('navigation')
  const debitCardTitle = t('stack.deposit.debitCard')

  return (
    <>
      <NextSeo title={`Send | ${debitCardTitle}`} />
      <DepositCoinbaseScreen defaultPaymentMethod="CARD" />
    </>
  )
}

function DebitCardLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation('navigation')

  return (
    <HomeLayout TopNav={<TopNav header={t('stack.deposit.debitCard')} backFunction="pop" />}>
      {children}
    </HomeLayout>
  )
}

Page.getLayout = (children) => <DebitCardLayout>{children}</DebitCardLayout>

export default Page
