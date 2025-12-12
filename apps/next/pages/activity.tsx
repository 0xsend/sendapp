import type { ReactNode } from 'react'
import { ActivityScreen } from 'app/features/activity/screen'
import { HomeLayout } from 'app/features/activity/layout.web'
import { NextSeo } from 'next-seo'
import type { NextPageWithLayout } from './_app'
import { TopNav } from 'app/components/TopNav'
import { PAGE_TITLES, PAGE_DESCRIPTIONS } from 'utils/seoHelpers'
import { useTranslation } from 'react-i18next'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <NextSeo title={PAGE_TITLES.activity} description={PAGE_DESCRIPTIONS.activity} />
      <ActivityScreen />
    </>
  )
}

function ActivityLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation('navigation')

  return (
    <HomeLayout
      scrollEnabled={false}
      TopNav={<TopNav header={t('tabs.activity')} showOnGtLg={true} />}
    >
      {children}
    </HomeLayout>
  )
}

Page.getLayout = (children) => <ActivityLayout>{children}</ActivityLayout>

export default Page
