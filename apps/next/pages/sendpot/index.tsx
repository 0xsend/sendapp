import { HomeLayout } from 'app/features/home/layout.web'
import { NextSeo } from 'next-seo'
import type { NextPageWithLayout } from '../_app'
import { TopNav } from 'app/components/TopNav'
import { SendPotScreen } from 'app/features/sendpot/screen'
import { useTranslation } from 'react-i18next'
import type { ReactNode } from 'react'

export const Page: NextPageWithLayout = () => {
  const { t } = useTranslation('navigation')

  return (
    <>
      <NextSeo title={`Send | ${t('stack.sendpot.root')}`} />
      <SendPotScreen />
    </>
  )
}

const SendpotLayout = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation('navigation')
  return (
    <HomeLayout TopNav={<TopNav header={t('stack.sendpot.root')} backFunction="router" />}>
      {children}
    </HomeLayout>
  )
}

Page.getLayout = (children) => <SendpotLayout>{children}</SendpotLayout>

export default Page
