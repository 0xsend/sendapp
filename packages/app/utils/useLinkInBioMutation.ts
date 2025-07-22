import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { z } from 'zod'
import { useAppToast } from '@my/ui'
import { useUser } from './useUser'
import type { Database, TablesInsert } from '@my/supabase/database-generated.types'

// Create Zod enum from database enum type
export const LinkInBioDomainNamesEnum = z.enum([
  'X',
  'Instagram',
  'YouTube',
  'TikTok',
  'GitHub',
  'Telegram',
  'Discord',
] as const satisfies ReadonlyArray<Database['public']['Enums']['link_in_bio_domain_names']>)

export const LinkInBioMutationSchema = z.array(
  z.object({
    domain_name: LinkInBioDomainNamesEnum,
    handle: z.string(),
  })
)

export type LinkInBioFormData = z.infer<typeof LinkInBioMutationSchema>

export const useLinkInBioMutation = () => {
  const supabase = useSupabase()
  const { user } = useUser()
  const queryClient = useQueryClient()
  const toast = useAppToast()

  return useMutation({
    async mutationFn(linkInBios: LinkInBioFormData) {
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Prepare data for upsert - set handle to null if empty
      const linkInBioToUpsert = linkInBios.map((link) => {
        const insertData = {
          user_id: user.id,
          domain_name: link.domain_name,
          handle: link.handle && link.handle.trim() !== '' ? link.handle.trim() : null,
        } satisfies Partial<TablesInsert<'link_in_bio'>>
        return insertData
      })

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
