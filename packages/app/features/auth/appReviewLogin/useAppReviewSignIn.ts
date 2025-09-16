import { useMutation } from '@tanstack/react-query'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { api } from 'app/utils/api'

export const useAppReviewSignIn = () => {
  const supabase = useSupabase()
  const { mutateAsync: appReviewSignInMutateAsync } = api.auth.appReviewSignIn.useMutation({
    retry: false,
  })

  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      // Call our custom API endpoint that bypasses captcha
      const authData = await appReviewSignInMutateAsync({
        email,
        password,
      })

      // Set the session in Supabase client
      if (authData.session) {
        await supabase.auth.setSession({
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token,
        })
      }

      return authData
    },
    retry: false,
  })
}
