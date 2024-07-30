import { useMemo, useState } from 'react'
import { SendAmountForm } from 'app/features/send/SendAmountForm'
import { encodeClaimCheckUrl, generateEphemeralKeypair } from 'app/features/checks/utils/checkUtils'
import { useCreateSendCheck } from 'app/features/checks/utils/useCreateSendCheck'
import type { Hex } from 'viem'
import { Label, Text, useToastController, XStack, YStack } from '@my/ui'
import { useSendScreenParams } from 'app/routers/params'
import { GreenSquare } from 'app/features/home/TokenBalanceCard'
import { ShareSendCheckURL } from 'app/features/checks/components/create/ShareSendCheckURL'
import { assert } from 'app/utils/assert'

export const CreateSendCheck = () => {
  const [claimCheckUrl, setClaimCheckUrl] = useState<string>()
  const [{ sendToken, amount }] = useSendScreenParams()

  const ephemeralKeypair = useMemo(() => generateEphemeralKeypair(), [])

  const parsedToken: Hex = useMemo(() => {
    return sendToken as Hex
  }, [sendToken])

  const parsedAmount: bigint = useMemo(() => {
    return BigInt(amount ?? 0)
  }, [amount])

  const createSendCheck = useCreateSendCheck({
    ephemeralKeypair,
    tokenAddress: sendToken as Hex,
    amount: BigInt(amount ?? 0),
  })

  const toast = useToastController()

  const onError = (error?: Error | string) => {
    if (error) {
      toast.show(`Error creating send check. ${error}`, {
        type: 'error',
        duration: 5000,
      })
      return
    }
    toast.show('Error creating send check', {
      type: 'error',
      duration: 5000,
    })
  }

  const onSubmit = async () => {
    try {
      validateSubmission(parsedToken, parsedAmount)

      const createSendCheckData = await createSendCheck()
      if (!createSendCheckData) {
        onError()
        return
      }

      const { receipt, senderSendId, ephemeralKeypair } = createSendCheckData
      if (!receipt.success) {
        onError('User operation failed.')
        return
      }

      // generate claim check url
      const claimCheckUrl =
        window.location.origin + encodeClaimCheckUrl(senderSendId, ephemeralKeypair)
      setClaimCheckUrl(claimCheckUrl)
    } catch (e) {
      onError(e)
    }
  }

  if (claimCheckUrl) {
    return <ShareSendCheckURL url={claimCheckUrl} />
  }

  return (
    <YStack w="100%" alignItems="flex-start" gap="$3">
      <YStack gap="$2" bc="transparent" br="$6">
        <XStack gap="$2" alignItems="center">
          <GreenSquare />
          <Label fontSize="$4" col="$color10" textTransform="uppercase">
            Create
          </Label>
        </XStack>
      </YStack>
      <YStack gap="$3">
        <Text fontSize="$9" fontWeight="bold">
          Create a Check
        </Text>
        <Text color="$darkGrayTextField" fontSize="$6">
          Send money to anyone via a URL.
        </Text>
      </YStack>

      <SendAmountForm onSubmit={onSubmit} />
    </YStack>
  )
}

const validateSubmission = (selectedCoin?: Hex, parsedAmount?: bigint) => {
  assert(!!selectedCoin, 'Invalid coin')
  assert(typeof parsedAmount === 'bigint' && parsedAmount > 0n, 'Invalid amount')
}
