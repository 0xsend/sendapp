import AsyncStorage from '@react-native-async-storage/async-storage'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const BASE_QUERY_KEY = 'sendAppAsyncStorage'

export function useAsyncStorage<T>(key: string) {
  const queryClient = useQueryClient()

  const useQueryItem = () =>
    useQuery<T | null>({
      queryKey: [BASE_QUERY_KEY, key],
      queryFn: async () => {
        const item = await AsyncStorage.getItem(key)
        return item ? (JSON.parse(item) as T) : null
      },
      staleTime: Number.POSITIVE_INFINITY,
    })

  const useSetItem = () =>
    useMutation<void, Error, T | null>({
      mutationFn: async (value) => {
        if (value === null) {
          await AsyncStorage.removeItem(key)
        } else {
          await AsyncStorage.setItem(key, JSON.stringify(value))
        }
      },
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: [BASE_QUERY_KEY, key] })
      },
    })

  return {
    useQueryItem,
    useSetItem,
  }
}
