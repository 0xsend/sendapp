import { useRouter } from 'solito/router'

export default function useRedirectAfterSend() {
  const router = useRouter()

  const redirect = (sendId?: number | null) => {
    router.replace({ pathname: `/profile/${sendId}/history` })
  }

  return {
    redirect,
  }
}
