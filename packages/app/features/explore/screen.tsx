import { LinkBanner, YStack } from '@my/ui'

export const ExploreScreen = () => {
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
        href={'/sendpot'}
        imgUrl={'url(https://ghassets.send.app/app_images/sendpot.jpg)'}
        title={'SENDPOT'}
        subtitle={'Challenge your luck, win big prizes'}
      />
      <LinkBanner
        href={'/feed'}
        imgUrl={'url(https://ghassets.send.app/app_images/feed.jpg)'}
        title={'Community Feed'}
      />
    </YStack>
  )
}
