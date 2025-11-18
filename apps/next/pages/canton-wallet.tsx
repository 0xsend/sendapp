import type { ReactNode } from 'react'
import { HomeLayout } from 'app/features/home/layout.web'
import { NextSeo } from 'next-seo'
import type { NextPageWithLayout } from './_app'
import { TopNav } from 'app/components/TopNav'
import { CantonWalletScreen } from 'app/features/canton-wallet/screen'
import { useTranslation } from 'react-i18next'

export const Page: NextPageWithLayout = () => {
  const { t } = useTranslation('navigation')
  const cantonTitle = t('stack.canton.root')

  return (
    <>
      <NextSeo title={`Send | ${cantonTitle}`} />
      <CantonWalletScreen />
    </>
  )
}

function CantonWalletLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation('navigation')

  return (
    <HomeLayout
      TopNav={<TopNav header={t('stack.canton.root')} backFunction="pop" showOnGtLg={true} />}
    >
      {children}
    </HomeLayout>
  )
}

Page.getLayout = (children) => <CantonWalletLayout>{children}</CantonWalletLayout>

export default Page
