import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { formFields } from 'app/utils/SchemaForm'
import { z } from 'zod'
import { useToastController } from '@my/ui'
import { useUser } from 'app/utils/useUser'
import { parsePhoneNumber } from 'libphonenumber-js'

export const AuthUserSchema = z.object({
  phone: formFields.text.describe('Phone'),
  xUsername: formFields.text.optional().describe('X'),
  // email: formFields.text.describe('Email'),
  // address: formFields.text.describe('Address'),
})

export const useAuthUserMutation = () => {
  const supabase = useSupabase()
  const queryClient = useQueryClient()
  const toast = useToastController()
  const { session } = useUser()

  return useMutation({
    async mutationFn(data: z.infer<typeof AuthUserSchema>) {
      let phone = data.phone
      try {
        // parse US first
        let parsed = parsePhoneNumber(data.phone, 'US')
        if (!parsed.isValid()) {
          parsed = parsePhoneNumber(data.phone.startsWith('+') ? data.phone : `+${data.phone}`)
          if (!parsed.isValid()) {
            throw new Error('Invalid phone number')
          }
        }
        phone = parsed.format('E.164')
      } catch (error) {
        throw new Error('Please enter a valid phone number')
      }

      const { error } = await supabase.auth.updateUser({
        phone: phone,
        // email: data.email,
        // @TODO: add address
      })

      if (error) {
        throw new Error(error.message)
      }
    },
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: ['profile', session?.user?.id] })

      toast.show('Check your phone', {
        message: 'We sent you a confirmation code to your phone.',
      })
    },
  })
}
