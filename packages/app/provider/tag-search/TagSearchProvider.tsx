import type { Functions } from '@my/supabase/database.types'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
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
  results: Functions<'tag_search'> | null
}

const TagSearch = createContext<TagSearchContextValue>(null as unknown as TagSearchContextValue)

let abortController: AbortController

type SearchTagsArgs = {
  supabase: ReturnType<typeof useSupabase>
  query: string
  limit_val?: number
  offset_val?: number
}
async function searchTags({ supabase, query, limit_val, offset_val }: SearchTagsArgs) {
  if (abortController) {
    abortController.abort()
  }
  abortController = new AbortController()
  const { data, error } = await supabase
    .rpc('tag_search', { query, limit_val, offset_val })
    .abortSignal(abortController.signal)
  return { data, error }
}

export const TagSearchProvider = ({ children }: { children: React.ReactNode }) => {
  const form = useForm<SearchSchema>()
  const supabase = useSupabase()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<PostgrestError | null>(null)
  const [results, setResults] = useState<Functions<'tag_search'> | null>(null)

  const onSearch = useDebounce(
    async function onSearch({ query }: SearchSchema) {
      try {
        setIsLoading(true)
        setError(null)
        const result = await searchTags({ supabase, query, limit_val: 10, offset_val: 0 })
        const { data, error } = result
        const results = data && data.length > 0 ? data[0] : []
        if (error) {
          if (error.message.includes('user aborted')) {
            return
          }
          setError(error)
          return
        }
        setResults(results)
      } finally {
        setIsLoading(false)
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
      setIsLoading(false)
      setError(null)
      setResults(null)
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
