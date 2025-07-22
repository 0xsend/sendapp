import { NextSeo } from 'next-seo'
import { UnknownScreen } from 'app/features/unknown/screen'
import { PAGE_TITLES, PAGE_DESCRIPTIONS } from 'utils/seoHelpers'

export default function Page() {
  return (
    <>
      <NextSeo title={PAGE_TITLES.notFound} description={PAGE_DESCRIPTIONS.notFound} />
      <UnknownScreen />
    </>
  )
}
