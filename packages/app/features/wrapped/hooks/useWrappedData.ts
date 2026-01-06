import { useEffect, useState } from 'react'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { fetchWrappedData } from '../utils/api'
import { loadWrappedData, saveWrappedData } from '../utils/storage'
import type { WrappedDataState } from '../types'
import { useUser } from 'app/utils/useUser'
import { isEligibleForWrapped } from '../utils/eligibility'

/**
 * React hook to manage wrapped data with storage caching
 *
 * Features:
 * - Checks eligibility before fetching any data
 * - Checks storage first before making API calls (localStorage on web, AsyncStorage on native)
 * - Automatically fetches and caches data on mount
 * - Handles loading and error states
 * - Data is immutable once fetched (won't refetch)
 */
export function useWrappedData(): WrappedDataState {
  const supabase = useSupabase()
  const { profile } = useUser()

  const [state, setState] = useState<WrappedDataState>({
    data: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    const sendId = profile?.send_id

    // Check eligibility first - if not eligible, skip all data fetching
    if (!isEligibleForWrapped(sendId)) {
      setState({
        data: null,
        loading: false,
        error: null,
      })
      return
    }

    async function loadData() {
      try {
        if (!profile?.send_id) {
          setState({
            data: null,
            loading: false,
            error: new Error('User not authenticated'),
          })
          return
        }

        // Check storage first
        const cachedData = await loadWrappedData(profile.send_id)

        if (cachedData) {
          setState({
            data: cachedData,
            loading: false,
            error: null,
          })
          return
        }

        // Fetch from API if not cached
        const data = await fetchWrappedData(supabase)
        await saveWrappedData(profile.send_id, data)
        setState({
          data,
          loading: false,
          error: null,
        })
      } catch (error) {
        setState({
          data: null,
          loading: false,
          error: error instanceof Error ? error : new Error('Failed to fetch wrapped data'),
        })
      }
    }

    void loadData()
  }, [profile?.send_id, supabase])

  return state
}
