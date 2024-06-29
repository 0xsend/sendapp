import { Button } from '@my/ui'
import type { CreateSendCheckBtnProps } from 'app/features/checks/types'
import { generateEphemeralKeypair } from 'app/features/checks/utils/checkUtils'
import { useCreateSendCheck } from 'app/features/checks/utils/useCreateSendCheck'

export const CreateSendCheckBtn = (props: CreateSendCheckBtnProps) => {
  const ephemeralKeypair = generateEphemeralKeypair()

  const createSendCheck = useCreateSendCheck({
    ephemeralKeypair,
    ...props,
  })

  const onPress = async () => {
    try {
      const { senderAccountId, ephemeralKeypair, receipt } = await createSendCheck()
      if (!receipt.success) {
        props.onError(new Error('Error creating send check'))
      }
      props.onSuccess(senderAccountId, ephemeralKeypair)
    } catch (e) {
      props.onError(e)
    }
  }

  return <Button onPress={onPress}>Send Check</Button>
}
