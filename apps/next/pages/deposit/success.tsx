import type { ReactNode } from 'react'
import { NextSeo } from 'next-seo'
import { HomeLayout } from 'app/features/home/layout.web'
import { TopNav } from 'app/components/TopNav'
import type { NextPageWithLayout } from '../_app'
import { DepositSuccessScreen } from 'app/features/deposit/success/screen'
import { useTranslation } from 'react-i18next'

export const Page: NextPageWithLayout = () => {
  const { t } = useTranslation('navigation')
  const depositTitle = t('stack.deposit.root')

  return (
    <>
      <NextSeo title={`Send | ${depositTitle}`} />
      <DepositSuccessScreen />
    </>
  )
}

function DepositSuccessLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation('navigation')

  return (
    <HomeLayout TopNav={<TopNav header={t('stack.deposit.root')} backFunction="home" />}>
      {children}
    </HomeLayout>
  )
}

Page.getLayout = (children) => <DepositSuccessLayout>{children}</DepositSuccessLayout>

export default Page
