import { LinkBanner, YStack } from '@my/ui'
import { Platform } from 'react-native'

export const ExploreScreen = ({ images }: { images: Record<string, string> }) => {
  return (
    <YStack
      w={'100%'}
      gap="$3.5"
      pb={'$3.5'}
      mt={'$3'}
      $gtLg={{
        w: '50%',
        mt: 0,
        gap: '$5',
      }}
    >
      <LinkBanner
        href={'/rewards'}
        imgUrl={images.rewards || ''}
        title={'Rewards'}
        subtitle={'Make money move for you'}
      />
      {Platform.OS === 'web' && (
        <LinkBanner
          href={'/sendpot'}
          imgUrl={images.sendpot || ''}
          title={'Sendpot'}
          subtitle={'Spin. Win. Brag.'}
        />
      )}
      <LinkBanner
        href={'/canton-wallet'}
        imgUrl={images.cantonWallet || ''}
        title={'Canton Wallet'}
        subtitle={'Get in first. Stay ahead.'}
      />
    </YStack>
  )
}
