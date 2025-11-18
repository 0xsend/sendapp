import { TopNav } from 'app/components/TopNav'
import { assetParam } from '../../../utils/assetParam'
import { WithdrawForm } from 'app/features/earn/withdraw/screen'
import { SendEarnProvider } from 'app/features/earn/providers/SendEarnProvider'
import { HomeLayout } from 'app/features/home/layout.web'
import type { GetServerSideProps } from 'next'
import { NextSeo } from 'next-seo'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from '../../_app'
import { useTranslation } from 'react-i18next'
import type { ReactNode } from 'react'

export const Page: NextPageWithLayout = () => {
  const { t } = useTranslation('navigation')
  const title = t('stack.earn.withdraw')

  return (
    <>
      <NextSeo title={`Send | ${title}`} />
      <SendEarnProvider>
        <WithdrawForm />
      </SendEarnProvider>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = (context) => {
  return assetParam(context, userProtectedGetSSP)
}

function EarnWithdrawLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation('navigation')

  return (
    <HomeLayout TopNav={<TopNav header={t('stack.earn.withdraw')} backFunction="router" />}>
      {children}
    </HomeLayout>
  )
}

Page.getLayout = (children) => <EarnWithdrawLayout>{children}</EarnWithdrawLayout>

export default Page
