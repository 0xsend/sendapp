import { TopNav } from 'app/components/TopNav'
import { ActiveEarningsScreen } from 'app/features/earn/active/screen'
import { SendEarnProvider } from 'app/features/earn/providers/SendEarnProvider'
import { assetParam } from '../../../utils/assetParam'
import { HomeLayout } from 'app/features/home/layout.web'
import type { GetServerSideProps } from 'next'
import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from '../../_app'
import { useTranslation } from 'react-i18next'
import type { ReactNode } from 'react'

export const Page: NextPageWithLayout = () => {
  const { t } = useTranslation('navigation')
  const title = t('stack.earn.details')

  return (
    <>
      <Head>
        <title>{`Send | ${title}`}</title>
      </Head>
      <SendEarnProvider>
        <ActiveEarningsScreen />
      </SendEarnProvider>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = (context) => {
  return assetParam(context, userProtectedGetSSP)
}

function EarnActiveLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation('navigation')

  return (
    <HomeLayout TopNav={<TopNav header={t('stack.earn.details')} backFunction="root" />}>
      {children}
    </HomeLayout>
  )
}

Page.getLayout = (children) => <EarnActiveLayout>{children}</EarnActiveLayout>

export default Page
