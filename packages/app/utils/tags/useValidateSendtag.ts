import { SendtagSchema } from 'app/utils/zod/sendtag'
import { SendtagAvailability } from '@my/api/src/routers/tag/types'
import { api } from 'app/utils/api'

export const useValidateSendtag = () => {
  const { mutateAsync: checkAvailabilityMutateAsync } = api.tag.checkAvailability.useMutation()

  const validateSendtag = async (name: string) => {
    const { error: schemaError } = SendtagSchema.safeParse({ name })

    if (schemaError) {
      throw new Error(schemaError.errors[0]?.message ?? 'Invalid Sendtag')
    }

    const { sendtagAvailability } = await checkAvailabilityMutateAsync({ name })

    if (sendtagAvailability === SendtagAvailability.Taken) {
      throw new Error('This Sendtag is already taken')
    }
  }

  return { validateSendtag }
}
