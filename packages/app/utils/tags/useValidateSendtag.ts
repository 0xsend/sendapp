import { SendtagSchema } from 'app/utils/zod/sendtag'
import { SendtagAvailability } from '@my/api/src/routers/tag/types'
import { api } from 'app/utils/api'
import { useMutation } from '@tanstack/react-query'

export const useValidateSendtag = () => {
  const { mutateAsync: checkAvailability } = api.tag.checkAvailability.useMutation()

  return useMutation({
    mutationFn: async ({ name }: { name: string }) => {
      const { data, error } = SendtagSchema.safeParse({ name })

      if (error || !data) {
        throw new Error(error.errors[0]?.message ?? 'Invalid Sendtag')
      }

      const { sendtagAvailability } = await checkAvailability({ name: data.name })

      if (sendtagAvailability === SendtagAvailability.Taken) {
        throw new Error('This Sendtag is already taken')
      }

      return data.name
    },
    retry: false,
  })
}
