import { useRouter } from 'expo-router'

export const useReplace = () => {
  const router = useRouter()
  return router.replace
}
