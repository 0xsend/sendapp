import { useMutation } from '@tanstack/react-query'
import { useSupabase } from 'app/utils/supabase/useSupabase'

export const useAppReviewSignIn = () => {
  const supabase = useSupabase()

  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw new Error(error.message)
      }

      return data
    },
    retry: false,
  })
}
