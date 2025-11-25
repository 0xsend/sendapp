import { SwapSummaryScreen } from '../../../../packages/app/features/swap/summary/screen'
import { HomeLayout } from 'app/features/home/layout.web'
import Head from 'next/head'
import type { NextPageWithLayout } from '../_app'
import { TopNav } from 'app/components/TopNav'
import { useTranslation } from 'react-i18next'
import type { ReactNode } from 'react'

export const Page: NextPageWithLayout = () => {
  const { t } = useTranslation('navigation')
  const summaryTitle = t('stack.trade.summary')

  return (
    <>
      <Head>
        <title>{`Send | ${summaryTitle}`}</title>
      </Head>
      <SwapSummaryScreen />
    </>
  )
}

function TradeSummaryLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation('navigation')

  return (
    <HomeLayout TopNav={<TopNav header={t('stack.trade.summary')} backFunction="router" />}>
      {children}
    </HomeLayout>
  )
}

Page.getLayout = (children) => <TradeSummaryLayout>{children}</TradeSummaryLayout>

export default Page
