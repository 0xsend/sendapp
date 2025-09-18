import type { Functions } from '@my/supabase/database.types'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { useDebounce } from '@my/ui'
import { formFields } from '../../utils/SchemaForm'
import type { PostgrestError } from '@supabase/supabase-js'

export const SearchSchema = z.object({
  query: formFields.text,
  limit_val: formFields.number.optional(),
  offset_val: formFields.number.optional(),
})
export type SearchSchema = z.infer<typeof SearchSchema>

export interface TagSearchContextValue {
  form: ReturnType<typeof useForm<SearchSchema>>
  isLoading: boolean
  error: PostgrestError | null
  results: Functions<'tag_search'>[number] | null
}

const TagSearch = createContext<TagSearchContextValue>(null as unknown as TagSearchContextValue)

interface SearchRequest {
  id: number
  query: string
  abortController: AbortController
}

let currentRequest: SearchRequest | null = null

type SearchTagsArgs = {
  supabase: ReturnType<typeof useSupabase>
  query: string
  limit_val?: number
  offset_val?: number
  requestId: number
}

async function searchTags({ supabase, query, limit_val, offset_val, requestId }: SearchTagsArgs) {
  if (currentRequest && currentRequest.id !== requestId) {
    currentRequest.abortController.abort()
  }
  const abortController = new AbortController()

  currentRequest = {
    id: requestId,
    query,
    abortController,
  }

  const { data, error } = await supabase
    .rpc('tag_search', { query, limit_val: limit_val ?? 10, offset_val: offset_val ?? 0 })
    .abortSignal(abortController.signal)

  return { data, error, requestId }
}

export const TagSearchProvider = ({ children }: { children: React.ReactNode }) => {
  const form = useForm<SearchSchema>()
  const supabase = useSupabase()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<PostgrestError | null>(null)
  const [results, setResults] = useState<Functions<'tag_search'>[number] | null>(null)
  const latestRequestIdRef = useRef<number | null>(null)

  const onSearch = useDebounce(
    async function onSearch({ query }: SearchSchema) {
      const requestId = Date.now()
      latestRequestIdRef.current = requestId

      try {
        setIsLoading(true)
        setError(null)

        const result = await searchTags({
          supabase,
          query,
          limit_val: 10,
          offset_val: 0,
          requestId,
        })

        const { data, error, requestId: responseRequestId } = result

        if (latestRequestIdRef.current !== responseRequestId) {
          return
        }

        if (error) {
          if (error.message.includes('user aborted') || error.message.includes('AbortError')) {
            return
          }
          setError(error)
          return
        }
        setResults(data?.[0] ?? null)
      } catch (err) {
        if (latestRequestIdRef.current === requestId) {
          if (err instanceof Error && !err.message.includes('abort')) {
            setError(err as PostgrestError)
          }
        }
      } finally {
        if (latestRequestIdRef.current === requestId) {
          setIsLoading(false)
        }
      }
    },
    300,
    { leading: false },
    [supabase]
  )
  const query = form.watch('query', '')

  useEffect(() => {
    if (query.length >= 1) {
      onSearch({ query, limit_val: 10 })
    } else {
      latestRequestIdRef.current = null
      if (currentRequest) {
        currentRequest.abortController.abort()
        currentRequest = null
      }
      setIsLoading(false)
      setError(null)
      setResults(null)
      onSearch.cancel()
    }
  }, [query, onSearch])

  const context = useMemo(
    () => ({
      form,
      isLoading,
      error,
      results,
    }),
    [form, isLoading, error, results]
  )

  return <TagSearch.Provider value={context}>{children}</TagSearch.Provider>
}

export const useTagSearch = () => {
  const ctx = useContext(TagSearch)
  if (!ctx) {
    throw new Error('useTagSearch must be used within a TagSearchProvider')
  }
  return ctx
}
