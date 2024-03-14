import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { formFields } from 'app/utils/SchemaForm'
import { useRouter } from 'solito/router'
import { z } from 'zod'
import { useToastController } from '@my/ui'

export const ProfileSchema = z.object({
  userName: formFields.text.describe('User Name'),
  displayName: formFields.text.describe('Display Name'),
  bio: formFields.textarea.describe('Bio'),
  isPublic: formFields.boolean_checkbox.describe('Is Public'),
})

export const useProfileMutation = (userID: string | undefined) => {
  const supabase = useSupabase()
  const queryClient = useQueryClient()
  const router = useRouter()
  const toast = useToastController()

  return useMutation({
    async mutationFn(data: z.infer<typeof ProfileSchema>) {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: data.userName,
          // TODO: add display name
          about: data.bio,
          is_public: data.isPublic,
        })
        .eq('id', userID ? userID : '')
      if (error) {
        throw new Error(error.message)
      }
    },
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast.show('Successfully updated')
    },
  })
}
