import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useUser } from 'app/utils/useUser'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToastController } from '@my/ui'
import type { z } from 'zod'
import type { AuthUserSchema } from 'app/utils/useAuthUserMutation'
import { formatDateToSupabaseFormat } from 'app/utils/dateHelper'

export const useProfileMutation = () => {
  const supabase = useSupabase()
  const { user } = useUser()
  const queryClient = useQueryClient()
  const toast = useToastController()

  return useMutation({
    async mutationFn(data: z.infer<typeof AuthUserSchema>) {
      if (!user) {
        return
      }

      const xUsernameToUpdate = data.xUsername || null
      const birthdayToUpdate = data.birthday ? formatDateToSupabaseFormat(data.birthday) : null

      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ x_username: xUsernameToUpdate, birthday: birthdayToUpdate })
        .eq('id', user?.id)

      if (profileUpdateError) {
        throw new Error(profileUpdateError.message)
      }
    },
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast.show('Personal data updated')
    },
  })
}
