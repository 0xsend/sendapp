import { LinkBanner, YStack } from '@my/ui'
import { Platform } from 'react-native'

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
        href={Platform.OS === 'web' ? '/explore/rewards' : '/rewards'}
        imgUrl={'https://ghassets.send.app/app_images/explore_rewards.jpg'}
        title={'Get Rewarded'}
        subtitle={'Earn SEND while engaging, referring, and growing the network'}
      />
      <LinkBanner
        href={'/sendpot'}
        imgUrl={'https://ghassets.send.app/app_images/sendpot.jpg'}
        title={'SENDPOT'}
        subtitle={'Challenge your luck, win big prizes'}
      />
      <LinkBanner
        href={'/feed'}
        imgUrl={'https://ghassets.send.app/app_images/feed.jpg'}
        title={'Community Feed'}
      />
    </YStack>
  )
}
