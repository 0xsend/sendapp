import { CreateSendCheckBtn } from 'app/features/checks/components/createSendCheckBtn'
import type { CreateSendCheckBtnProps, EphemeralKeyPair } from 'app/features/checks/types'
import { useEffect, useState } from 'react'
import type { Hex } from 'viem'
import { encodeClaimCheckUrl } from 'app/features/checks/utils/checkUtils'
import type { GetUserOperationReceiptReturnType } from 'permissionless'
import { baseMainnetClient, sendTokenAddress } from '@my/wagmi'

export const CreateSendCheck = () => {
  const [createCheckProps, setCreateCheckProps] = useState<CreateSendCheckBtnProps>()

  useEffect(() => {
    // set defaults for /send check creation
    setCreateCheckProps({
      // TODO: pass dynamic args from parent
      tokenAddress: sendTokenAddress[baseMainnetClient.chain.id] as Hex,
      amount: BigInt(100000),
      onSuccess,
      onError,
    })
  }, [])

  const onSuccess = (
    receipt: GetUserOperationReceiptReturnType,
    senderAccountId: string,
    ephemeralKeypair: EphemeralKeyPair
  ) => {
    const checkUrl: string = encodeClaimCheckUrl(senderAccountId, ephemeralKeypair)
    console.log(checkUrl)
  }

  const onError = (error: Error) => {
    // TODO: handle error creating send check
    throw error
  }

  return createCheckProps && <CreateSendCheckBtn {...createCheckProps} />
}
