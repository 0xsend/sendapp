import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { formFields } from 'app/utils/SchemaForm'
import { useRouter } from 'solito/router'
import { z } from 'zod'
import { useToastController } from '@my/ui'

export const PersonalInfoSchema = z.object({
  phone: formFields.text.describe('Phone'),
  email: formFields.text.describe('Email'),
  address: formFields.text.describe('Address'),
})

export const usePersonalInfoMutation = (userID: string | undefined) => {
  const supabase = useSupabase()
  const queryClient = useQueryClient()
  const toast = useToastController()

  return useMutation({
    async mutationFn(data: z.infer<typeof PersonalInfoSchema>) {
      const { error } = await supabase.auth.updateUser({
        phone: data.phone,
        email: data.email,
        // @TODO: add address
      })

      if (error) {
        throw new Error(error.message)
      }
    },
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast.show('Check your phone', {
        message: 'We sent you a confirmation code to your phone.',
      })
    },
  })
}
