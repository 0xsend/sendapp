import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { formFields } from 'app/utils/SchemaForm'
import { z } from 'zod'
import { useAppToast } from '@my/ui'
import { useAnalytics } from 'app/provider/analytics'

export const AuthUserSchema = z.object({
  phone: formFields.text,
  birthday: formFields.date.optional(),
  xUsername: formFields.text.optional(),
  // email: formFields.text.describe('Email'),
  // address: formFields.text.describe('Address'),
})

export const useAuthUserMutation = () => {
  const supabase = useSupabase()
  const queryClient = useQueryClient()
  const toast = useAppToast()
  const analytics = useAnalytics()

  return useMutation({
    async mutationFn(data: z.infer<typeof AuthUserSchema>) {
      const { error } = await supabase.auth.updateUser({
        phone: data.phone,
        // email: data.email,
        // @TODO: add address
      })

      if (error) {
        throw new Error(error.message)
      }
    },
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: ['user'] })

      analytics.capture({
        name: 'phone_otp_sent',
        properties: {},
      })

      toast.show('Check your phone', {
        message: 'We sent you a confirmation code to your phone.',
      })
    },
  })
}
