import { LinkBanner, YStack } from '@my/ui'
import { Platform } from 'react-native'

export const ExploreScreen = ({ images }: { images: Record<string, string> }) => {
  return (
    <YStack
      w={'100%'}
      gap="$5"
      pb={'$3.5'}
      mt={Platform.OS === 'web' ? undefined : '$3'}
      $gtLg={{
        w: '50%',
      }}
    >
      <LinkBanner
        href={'/rewards'}
        imgUrl={images.rewards || ''}
        title={'Get Rewarded'}
        subtitle={'Earn SEND while engaging, referring, and growing the network'}
      />
      {Platform.OS === 'web' && (
        <LinkBanner
          href={'/sendpot'}
          imgUrl={images.sendpot || ''}
          title={'SENDPOT'}
          subtitle={'Challenge your luck, win big prizes'}
        />
      )}
      <LinkBanner href={'/feed'} imgUrl={images.feed || ''} title={'Community Feed'} />
    </YStack>
  )
}
