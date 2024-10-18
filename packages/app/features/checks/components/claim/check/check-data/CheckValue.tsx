import { Text } from '@my/ui'
import { useTokenPrice } from 'app/utils/coin-gecko'
import { useMemo } from 'react'

interface Props {
  tokenId: string
  tokenAmount: bigint
}

export const CheckValue = (props: Props) => {
  const { data } = useTokenPrice(props.tokenId)

  const checkValue: number | undefined = useMemo(() => {
    if (data?.[props.tokenId]?.usd) {
      const tokenPrice = data?.[props.tokenId]?.usd
      return Number(props.tokenAmount) * (tokenPrice as number)
    }
  }, [data, props.tokenAmount, props.tokenId])

  if (checkValue) {
    return <Text fontSize="$6">${checkValue.toFixed(2).toLocaleString()}</Text>
  }
}
