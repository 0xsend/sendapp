import { CheckPublicPreviewScreen } from 'app/features/check/claim/public-preview'
import { NextSeo } from 'next-seo'
import type { NextPageWithLayout } from '../_app'
import { HomeLayout } from 'app/features/home/layout.web'
import { TopNav } from 'app/components/TopNav'
import type { ReactNode } from 'react'
import { useRouter } from 'next/router'

export const Page: NextPageWithLayout = () => {
  const router = useRouter()
  const code = (router.query.code as string) ?? ''

  return (
    <>
      <NextSeo
        title="Claim Check | Send"
        description="Someone sent you tokens! Create an account to claim."
      />
      <CheckPublicPreviewScreen code={code} />
    </>
  )
}

const CheckPublicPreviewLayout = ({ children }: { children: ReactNode }) => {
  return <HomeLayout TopNav={<TopNav header="Claim Check" showLogo />}>{children}</HomeLayout>
}

Page.getLayout = (children) => <CheckPublicPreviewLayout>{children}</CheckPublicPreviewLayout>

export default Page
