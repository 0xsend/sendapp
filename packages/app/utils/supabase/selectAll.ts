import type { Database } from '@my/supabase/database.types'
import type { PostgrestFilterBuilder } from '@supabase/postgrest-js'
import { assert } from '../assert'

/**
 * Given a postgrest query builder, fetch all rows by paginating through the results.
 */
export async function selectAll<R extends Record<string, unknown>, T>(
  queryBuilder: PostgrestFilterBuilder<Database['public'], R, T>
): Promise<T> {
  const result: T[] = []
  let page = 0
  let totalCount: number | null = null
  let pageSize = 100

  assert(
    'range' in queryBuilder && typeof queryBuilder.range === 'function',
    'Invalid query builder'
  )

  do {
    const { data, count, error } = await queryBuilder.range(
      page * pageSize,
      (page + 1) * pageSize - 1
    )

    if (error) {
      throw error
    }

    assert(count !== null, 'Count is null')
    assert(Number.isInteger(count) && count >= 0, 'Invalid count')

    if (totalCount === null && count !== null) {
      totalCount = count
    }

    assert(Array.isArray(data), 'Invalid data')

    if (page === 0 && data.length < count && data.length < pageSize) {
      pageSize = data.length // Use the actual page size if it's smaller than the default
    }

    result.push(...(data as T[]))

    page += 1
  } while (totalCount !== null && result.length < totalCount)

  return result as T
}
