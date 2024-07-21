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
      const createSendCheckData = await createSendCheck()
      const { senderSendId, ephemeralKeypair, receipt } = createSendCheckData

      if (!receipt.success) {
        props.onError(new Error('Error creating send check'))
        return
      }
      props.onSuccess(receipt, senderSendId, ephemeralKeypair)
    } catch (e) {
      props.onError(e)
    }
  }

  return <Button onPress={onPress}>Write Send Check</Button>
}
