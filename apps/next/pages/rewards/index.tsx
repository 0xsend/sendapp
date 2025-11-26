import type { ReactNode } from 'react'
import { ActivityRewardsScreen } from 'app/features/rewards/activity/screen'
import { NextSeo } from 'next-seo'
import type { NextPageWithLayout } from 'next-app/pages/_app'
import { HomeLayout } from 'app/features/home/layout.web'
import { TopNav } from 'app/components/TopNav'
import { MobileButtonRowLayout } from 'app/components/MobileButtonRowLayout'
import { useTranslation } from 'react-i18next'

export const Page: NextPageWithLayout = () => {
  const { t } = useTranslation('navigation')
  const rewardsTitle = t('stack.rewards.root')

  return (
    <>
      <NextSeo title={`Send | ${rewardsTitle}`} />
      <ActivityRewardsScreen />
    </>
  )
}

function RewardsLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation('navigation')

  return (
    <MobileButtonRowLayout.ActivityRewards>
      <HomeLayout TopNav={<TopNav header={t('stack.rewards.root')} backFunction={'pop'} />}>
        {children}
      </HomeLayout>
    </MobileButtonRowLayout.ActivityRewards>
  )
}

Page.getLayout = (children) => <RewardsLayout>{children}</RewardsLayout>

export default Page
