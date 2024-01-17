import { Functions } from '@my/supabase/database.types'
import { assert } from 'app/utils/assert'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { useDebounce } from '@my/ui'
import { formFields } from '../../utils/SchemaForm'
import { PostgrestError } from '@supabase/supabase-js'

export const SearchSchema = z.object({
  query: formFields.text,
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

type SearchTagsArgs = { supabase: ReturnType<typeof useSupabase>; query: string }
async function searchTags({ supabase, query }: SearchTagsArgs) {
  if (abortController) {
    abortController.abort()
  }
  abortController = new AbortController()
  const { data, error } = await supabase
    .rpc('tag_search', { query })
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
        const result = await searchTags({ supabase, query })
        const { data, error } = result
        if (error) {
          if (error.message.includes('user aborted')) {
            return
          }
          setError(error)
          return
        }
        setResults(data === null ? [] : data)
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
    if (query.length > 2) {
      onSearch({ query })
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
