import { BuyTicketsScreen } from 'app/features/sendpot/BuyTicketsScreen'
import { HomeLayout } from 'app/features/home/layout.web'
import { NextSeo } from 'next-seo'
import type { NextPageWithLayout } from '../_app'
import { TopNav } from 'app/components/TopNav'
import { useTranslation } from 'react-i18next'
import type { ReactNode } from 'react'

export const Page: NextPageWithLayout = () => {
  const { t } = useTranslation('navigation')

  return (
    <>
      <NextSeo title={`Send | ${t('stack.sendpot.buyTickets')}`} />
      <BuyTicketsScreen />
    </>
  )
}

const SendpotBuyLayout = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation('navigation')
  return (
    <HomeLayout TopNav={<TopNav header={t('stack.sendpot.buyTickets')} backFunction="router" />}>
      {children}
    </HomeLayout>
  )
}

Page.getLayout = (children) => <SendpotBuyLayout>{children}</SendpotBuyLayout>

export default Page
