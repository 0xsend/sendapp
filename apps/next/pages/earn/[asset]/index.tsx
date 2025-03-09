import { TopNav } from 'app/components/TopNav'
import { ActiveEarnings } from 'app/features/earn/ActiveEarnings'
import { HomeLayout } from 'app/features/home/layout.web'
import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from '../../_app'
import { coinsBySymbol } from 'app/data/coins'
import type { GetServerSideProps } from 'next'
import type { ParsedUrlQuery } from 'node:querystring'
import debug from 'debug'

const log = debug('app:pages:earn:deposit')

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send | Active Earnings</title>
      </Head>
      <ActiveEarnings />
    </>
  )
}

interface Params extends ParsedUrlQuery {
  asset?: string
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { asset } = context.params as Params

  if (!asset) {
    log('no asset')
    return {
      redirect: {
        destination: '/earn',
        permanent: false,
      },
    }
  }

  if (!coinsBySymbol[asset.toUpperCase()]) {
    log('coin not supported', asset)
    // 404 if coin is not supported
    return {
      notFound: true,
    }
  }

  return userProtectedGetSSP()(context)
}

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Active Earnings" backFunction="root" />}>
    {children}
  </HomeLayout>
)

export default Page
