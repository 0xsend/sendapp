import { useRouter } from 'expo-router'

export default function useRedirectAfterSend() {
  const router = useRouter()

  const redirect = (sendId?: number | null) => {
    const pathname = sendId ? `/profile/${sendId}/history` : '/activity'
    router.replace({ pathname })
  }

  return {
    redirect,
  }
}
