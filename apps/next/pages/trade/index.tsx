import { SwapFormScreen } from '../../../../packages/app/features/swap/form/screen'
import { HomeLayout } from 'app/features/home/layout.web'
import { NextSeo } from 'next-seo'
import type { NextPageWithLayout } from '../_app'
import { TopNav } from 'app/components/TopNav'
import { useTranslation } from 'react-i18next'
import type { ReactNode } from 'react'

export const Page: NextPageWithLayout = () => {
  const { t } = useTranslation('navigation')
  const tradeTitle = t('stack.trade.root')

  return (
    <>
      <NextSeo title={`Send | ${tradeTitle}`} />
      <SwapFormScreen />
    </>
  )
}

function TradeLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation('navigation')

  return (
    <HomeLayout TopNav={<TopNav header={t('stack.trade.root')} backFunction="router" />}>
      {children}
    </HomeLayout>
  )
}

Page.getLayout = (children) => <TradeLayout>{children}</TradeLayout>

export default Page
