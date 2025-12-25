import type { ReactNode } from 'react'
import { DepositScreen } from 'app/features/deposit/screen'
import { HomeLayout } from 'app/features/home/layout.web'
import { TopNav } from 'app/components/TopNav'
import { NextSeo } from 'next-seo'
import type { NextPageWithLayout } from '../_app'
import { useTranslation } from 'react-i18next'

export const Page: NextPageWithLayout = () => {
  const { t } = useTranslation('navigation')
  const depositTitle = t('stack.savings.root')

  return (
    <>
      <NextSeo title={`Send | ${depositTitle}`} />
      <DepositScreen />
    </>
  )
}

function DepositLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation('navigation')

  return (
    <HomeLayout TopNav={<TopNav header={t('stack.savings.root')} backFunction="home" />}>
      {children}
    </HomeLayout>
  )
}

Page.getLayout = (children) => <DepositLayout>{children}</DepositLayout>

export default Page
