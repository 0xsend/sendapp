import { useUser } from './useUser'
import { useEffect } from 'react'

export function usePendingTags() {
  const { tags, isLoading } = useUser()

  useEffect(() => {
    console.log('Tags state:', {
      allTags: tags,
      pendingTags: tags?.filter((t) => t.status === 'pending'),
      isLoading,
    })
  }, [tags, isLoading])

  return tags?.filter((t) => t.status === 'pending')
}

export function useConfirmedTags() {
  const { tags } = useUser()
  return tags?.filter((t) => t.status === 'confirmed') ?? []
}
