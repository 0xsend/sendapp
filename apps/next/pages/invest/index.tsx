import Head from 'next/head'
import type { ReactNode } from 'react'
import type { NextPageWithLayout } from '../_app'
import { TopNav } from 'app/components/TopNav'
import { InvestScreen } from 'app/features/invest/screen'
import { HomeLayout } from 'app/features/home/layout.web'
import { useTranslation } from 'react-i18next'

export const Page: NextPageWithLayout = () => {
  const { t: tNavigation } = useTranslation('navigation')
  const { t: tInvest } = useTranslation('invest')
  const investTitle = tNavigation('stack.investments.root')
  const metaDescription = tInvest('meta.description')

  return (
    <>
      <Head>
        <title>{`Send | ${investTitle}`}</title>
        <meta name="description" content={metaDescription} />
      </Head>
      <InvestScreen />
    </>
  )
}

function InvestLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation('navigation')

  return (
    <HomeLayout
      TopNav={
        <TopNav header={t('stack.investments.root')} backFunction="router" showOnGtLg={true} />
      }
    >
      {children}
    </HomeLayout>
  )
}

Page.getLayout = (children) => <InvestLayout>{children}</InvestLayout>

export default Page
