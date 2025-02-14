import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { formFields } from 'app/utils/SchemaForm'
import { z } from 'zod'
import { useToastController } from '@my/ui'

export const ProfileSchema = z.object({
  name: formFields.text,
  about: formFields.textarea,
  isPublic: formFields.boolean_checkbox,
})

export const useProfileMutation = (userID: string | undefined) => {
  const supabase = useSupabase()
  const queryClient = useQueryClient()
  const toast = useToastController()

  return useMutation({
    async mutationFn(data: z.infer<typeof ProfileSchema>) {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: data.name,
          about: data.about,
          is_public: data.isPublic,
        })
        .eq('id', userID ? userID : '')
      if (error) {
        throw new Error(error.message)
      }
    },
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast.show('Successfully updated', { customData: { theme: 'green' } })
    },
  })
}
