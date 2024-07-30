import { ScanScreen } from 'app/features/scan/screen'
import Head from 'next/head'
;('@supabase/auth-helpers-nextjs')
import type { NextPageWithLayout } from './_app'
import { userProtectedGetSSP } from 'utils/userProtected'
import { YStack } from '@my/ui'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send | Scan</title>
      </Head>
      <ScanScreen />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()

Page.getLayout = (children) => (
  <YStack h="100vh" display="flex" justifyContent="center" alignItems="center">
    {children}
  </YStack>
)

export default Page
