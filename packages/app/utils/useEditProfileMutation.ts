import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { formFields } from 'app/utils/SchemaForm'
import { useRouter } from 'solito/router'
import { z } from 'zod'

export const ProfileSchema = z.object({
  name: formFields.text.describe('Name'),
  about: formFields.textarea.describe('About'),
  isPublic: formFields.boolean_checkbox.describe('IsPublic'),
})

export const useEditProfileMutation = (userID: string | undefined) => {
  const supabase = useSupabase()
  const queryClient = useQueryClient()
  const router = useRouter()

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
      await queryClient.invalidateQueries(['profile'])
      router.push('/settings')
    },
  })
}
