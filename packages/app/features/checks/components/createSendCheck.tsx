import { CreateSendCheckBtn } from 'app/features/checks/components/createSendCheckBtn'
import type { CreateSendCheckBtnProps, EphemeralKeyPair } from 'app/features/checks/types'
import { useEffect, useState } from 'react'
import type { Hex } from 'viem'
import { generateCheckUrl } from 'app/features/checks/utils/checkUtils'

export const CreateSendCheck = () => {
  const [createCheckProps, setCreateCheckProps] = useState<CreateSendCheckBtnProps>()

  useEffect(() => {
    // set defaults for /send check creation
    setCreateCheckProps({
      // TODO: pass dynamic args from parent
      tokenAddress: '0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A' as Hex,
      amount: 1n,
      onSuccess,
      onError,
    })
  }, [])

  const onSuccess = (senderAccountId: string, ephemeralKeypair: EphemeralKeyPair) => {
    const checkUrl: string = generateCheckUrl(senderAccountId, ephemeralKeypair)
    // TODO: show checkUrl to sender
    console.log(checkUrl)
  }

  const onError = (error: Error) => {
    // TODO: handle error creating send check
    throw error
  }

  return createCheckProps && <CreateSendCheckBtn {...createCheckProps} />
}
