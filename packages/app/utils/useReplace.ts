import { useRouter } from 'solito/router'

export const useReplace = () => {
  const router = useRouter()
  return router.replace as (url: string) => void
}
