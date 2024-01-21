import { Container, H1, H3, Stack, View, YStack } from '@my/ui'
import { IconSLogo } from 'app/components/icons'
import { InstantPayments } from 'app/components/img/instant-payments'

export const SignInScreen = () => {
  return (
    <Container>
      <Stack pos="relative" h="100svh" f={1} ai="center" jc="center">
        <View pos="absolute" top={0} left={0} mt="auto" mb="auto" zIndex={-1} w="100%" h="100%">
          <View mt="auto" mb="auto" w="100%" h="100%" mah="95svh">
            <YStack pos="absolute" bottom={'10%'} left={'10%'} gap="$6">
              <H1 size="$13" lineHeight={'$5'} textTransform="uppercase">
                Instant
              </H1>
              <H1 size="$13" lineHeight={'$5'} textTransform="uppercase">
                Payments <sup style={{ fontSize: '40px' }}>TM</sup>
              </H1>
              <H3 fontWeight={'normal'} textTransform="uppercase" maw="55%">
                INFRASTRUCTURE FOR MERCHANTS AND STABLECOIN TRANSACTIONS
              </H3>
            </YStack>
            <InstantPayments width="100%" height="100%" />
          </View>
        </View>
      </Stack>
      <View position="absolute" bottom={'$10'} right={'$5'} width={'$5'}>
        <IconSLogo />
      </View>
    </Container>
  )
}
