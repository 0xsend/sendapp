import { useRouter } from 'solito/router'

export const usePush = () => {
  const router = useRouter()
  return router.push as (url: string) => void
}
