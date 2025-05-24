import { useUser } from './useUser'

export function usePendingTags() {
  const { tags } = useUser()
  return Array.isArray(tags) ? tags.filter((t) => t.status === 'pending') : []
}

export function useConfirmedTags() {
  const { tags } = useUser()
  return Array.isArray(tags) ? tags.filter((t) => t.status === 'confirmed') : []
}
