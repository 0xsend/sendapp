import { useRouter } from 'expo-router'

export const usePush = () => {
  const router = useRouter()
  return router.push
}
