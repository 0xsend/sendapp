import type { ReactNode } from 'react'
import { HomeLayout } from 'app/features/home/layout.web'
import { TopNav } from 'app/components/TopNav'
import { NextSeo } from 'next-seo'
import type { NextPageWithLayout } from '../_app'
import { DepositCryptoScreen } from 'app/features/deposit/crypto/screen'
import { useTranslation } from 'react-i18next'

export const Page: NextPageWithLayout = () => {
  const { t } = useTranslation('navigation')
  const cryptoTitle = t('stack.deposit.onBase')

  return (
    <>
      <NextSeo title={`Send | ${cryptoTitle}`} />
      <DepositCryptoScreen />
    </>
  )
}

function CryptoDepositLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation('navigation')

  return (
    <HomeLayout TopNav={<TopNav header={t('stack.deposit.onBase')} backFunction="pop" />}>
      {children}
    </HomeLayout>
  )
}

Page.getLayout = (children) => <CryptoDepositLayout>{children}</CryptoDepositLayout>

export default Page
