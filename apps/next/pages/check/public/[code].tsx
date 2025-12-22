import { CheckPublicPreviewScreen } from 'app/features/check/claim/public-preview'
import { NextSeo } from 'next-seo'
import type { NextPageWithLayout } from '../../_app'
import { AuthLayout } from 'app/features/auth/layout.web'
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
      <CheckPublicPreviewScreen checkCode={code} />
    </>
  )
}

Page.getLayout = (children) => <AuthLayout>{children}</AuthLayout>

export default Page
