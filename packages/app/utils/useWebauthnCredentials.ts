import { useQuery } from '@tanstack/react-query'
import { useSupabase } from './supabase/useSupabase'
import { useUser } from './useUser'

export const useWebauthnCredentials = () => {
  const { user } = useUser()
  const supabase = useSupabase()

  return useQuery({
    queryKey: ['webauthn_credentials'],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from('webauthn_credentials').select('*')

      if (error) {
        // no rows
        if (error.code === 'PGRST116') {
          return []
        }
        throw new Error(error.message)
      }
      return data
    },
  })
}
