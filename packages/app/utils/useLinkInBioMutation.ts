import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { formFields } from 'app/utils/SchemaForm'
import { z } from 'zod'
import { useToastController } from '@my/ui'
import { useUser } from './useUser'
import { LinkInBioDomainNamesEnum } from './zod/LinkInBioSchema'

export const LinkInBioMutationSchema = z.array(
  z.object({
    domain_name: LinkInBioDomainNamesEnum,
    handle: formFields.text,
  })
)

export type LinkInBioFormData = z.infer<typeof LinkInBioMutationSchema>

export const useLinkInBioMutation = () => {
  const supabase = useSupabase()
  const { user } = useUser()
  const queryClient = useQueryClient()
  const toast = useToastController()

  return useMutation({
    async mutationFn(linkInBios: LinkInBioFormData) {
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Prepare data for upsert - set handle to null if empty
      const linkInBioToUpsert = linkInBios.map((link) => ({
        user_id: user.id,
        domain_name: link.domain_name,
        handle: link.handle && link.handle.trim() !== '' ? link.handle.trim() : null,
      }))

      // Upsert the social links
      const { data: result, error } = await supabase
        .from('link_in_bio')
        .upsert(linkInBioToUpsert, {
          onConflict: 'user_id,domain_name',
          ignoreDuplicates: false,
        })
        .select()

      if (error) {
        throw new Error(`Failed to upsert link in bio: ${error.message}`)
      }

      return result
    },
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: ['link_in_bio'] })
      await queryClient.invalidateQueries({ queryKey: ['profile'] }) // Also invalidate profile to update useUser
      toast.show('Link in bio updated successfully')
    },
  })
}
