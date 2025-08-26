import { YStack } from '@my/ui'
import type { CoinWithBalance } from 'app/data/coins'
import { TokenDetailsHeader } from 'app/features/home/TokenDetailsHeader'
import { TokenAbout } from 'app/features/home/TokenAbout'

export const TokenDetails = ({ coin }: { coin: CoinWithBalance }) => {
  return (
    <YStack f={1} gap="$3" $gtLg={{ w: '45%', pb: '$0' }} pb="$4">
      <TokenDetailsHeader coin={coin} />
      <TokenAbout coin={coin} />
    </YStack>
  )
}
