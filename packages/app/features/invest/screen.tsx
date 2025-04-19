import { LinkBanner, YStack } from '@my/ui'

export const InvestScreen = () => {
  return (
    <YStack
      w={'100%'}
      gap="$5"
      pb={'$3.5'}
      $gtLg={{
        w: '50%',
      }}
    >
      <LinkBanner
        href={'/earn'}
        imgUrl={'url(https://ghassets.send.app/app_images/deposit.jpg)'}
        title={'Earn'}
        subtitle={'High-yield interest on your USDC — no lockups, no minimums, full control'}
        backgroundPosition={'center 15%'}
      />
    </YStack>
  )
}
