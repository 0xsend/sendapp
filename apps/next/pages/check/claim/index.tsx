import { CheckPublicPreviewScreen } from 'app/features/check/claim/public-preview'
import { useSendAccount } from 'app/utils/send-accounts'
import { useSearchParams } from 'solito/navigation'
import { useRouter } from 'solito/router'
import { NextSeo } from 'next-seo'
import type { NextPageWithLayout } from '../../_app'
import { HomeLayout } from 'app/features/home/layout.web'
import { TopNav } from 'app/components/TopNav'
import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { Spinner, YStack } from '@my/ui'

export const Page: NextPageWithLayout = () => {
  const { data: sendAccount, isLoading } = useSendAccount()
  const searchParams = useSearchParams()
  const router = useRouter()
  const checkCode = searchParams?.get('code') ?? ''

  // Redirect authenticated users to the preview page
  useEffect(() => {
    if (!isLoading && sendAccount && checkCode) {
      router.replace(`/check/claim/preview?code=${encodeURIComponent(checkCode)}`)
    }
  }, [isLoading, sendAccount, checkCode, router])

  // Show loading while checking auth or redirecting
  if (isLoading || sendAccount) {
    return (
      <YStack f={1} ai="center" jc="center">
        <Spinner size="large" />
      </YStack>
    )
  }

  return (
    <>
      <NextSeo title="Claim Check | Send" description="Preview and claim your Send Check" />
      <CheckPublicPreviewScreen checkCode={checkCode} />
    </>
  )
}

const CheckClaimLayout = ({ children }: { children: ReactNode }) => {
  return (
    <HomeLayout TopNav={<TopNav header="Claim Check" backFunction="pop" showBackOnDesktop />}>
      {children}
    </HomeLayout>
  )
}

Page.getLayout = (children) => <CheckClaimLayout>{children}</CheckClaimLayout>

export default Page
