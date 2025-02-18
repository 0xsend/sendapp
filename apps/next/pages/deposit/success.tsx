import { Check } from '@tamagui/lucide-icons'
import { Button, Text, YStack, Card, XStack, LinkableButton } from '@my/ui'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { HomeLayout } from 'app/features/home/layout.web'
import { TopNav } from 'app/components/TopNav'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from '../_app'

export const Page: NextPageWithLayout = () => {
  const router = useRouter()

  return (
    <>
      <Head>
        <title>Send | Deposit</title>
      </Head>
      <YStack width="100%" $gtSm={{ width: 600 }} gap="$4">
        <Card bc="$color1" width="100%" p="$6">
          <YStack ai="center" gap="$4">
            <Check size={48} color="#22c55e" />
            <Text fontSize="$8" fontWeight="600" ta="center">
              Deposit Successful
            </Text>
            <Text color="$gray11" ta="center">
              Your funds are on the way. They will appear in your wallet shortly.
            </Text>
            <Button
              theme="green"
              px="$3.5"
              h="$4.5"
              borderRadius="$4"
              f={1}
              onPress={() => router.push('/deposit')}
            >
              <XStack w="100%" gap="$2.5" ai="center" jc="center">
                <LinkableButton.Text
                  fontWeight="500"
                  tt="uppercase"
                  $theme-dark={{ col: '$color0' }}
                >
                  Make Another Deposit
                </LinkableButton.Text>
              </XStack>
            </Button>
          </YStack>
        </Card>
      </YStack>
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Deposit" backFunction="home" />}>{children}</HomeLayout>
)

export default Page
