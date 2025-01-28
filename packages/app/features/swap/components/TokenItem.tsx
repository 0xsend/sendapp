import { XStack, Paragraph } from '@my/ui'
import { IconCoin } from 'app/components/icons/IconCoin'
import type { CoinWithBalance } from 'app/data/coins'

export default function TokenItem({ coin }: { coin: CoinWithBalance }) {
  return (
    <XStack gap={'$2'} $gtLg={{ gap: '$3.5' }} ai={'center'}>
      <IconCoin symbol={coin.symbol} />
      <Paragraph fontSize={'$5'} fontWeight={'500'} textTransform={'uppercase'} color={'$color12'}>
        {coin.label}
      </Paragraph>
    </XStack>
  )
}
