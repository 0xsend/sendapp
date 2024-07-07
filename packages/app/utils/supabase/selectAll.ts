import type { Database } from '@my/supabase/database.types'
import type { PostgrestError, PostgrestTransformBuilder } from '@supabase/postgrest-js'
import { assert } from '../assert.js'

/**
 * Given a postgrest query builder, fetch all rows by paginating through the results.
 */
export async function selectAll<R extends Record<string, unknown>, T>(
  queryBuilder: PostgrestTransformBuilder<Database['public'], R, T>
): Promise<{
  data: T | null
  count: number | null
  error: PostgrestError | null
}> {
  const result: T = [] as T
  let page = 0
  let totalCount: number | null = null
  let pageSize = 100

  try {
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
        return {
          data: null,
          count: null,
          error,
        }
      }

      assert(
        count !== null,
        'Count is null. Be sure to use the "exact" option when calling selectAll'
      )
      assert(Number.isInteger(count) && count >= 0, 'Invalid count')

      if (totalCount === null && count !== null) {
        totalCount = count
      }

      assert(Array.isArray(data), 'Invalid data')

      if (page === 0 && data.length < count && data.length < pageSize) {
        pageSize = data.length // Use the actual page size if it's smaller than the default
      }

      // @ts-expect-error data is an array
      result.push(...data)

      page += 1
    } while (
      totalCount !== null &&
      // @ts-expect-error result is an array
      result.length < totalCount
    )

    return {
      data: result,
      count: totalCount,
      error: null,
    }
  } catch (e) {
    return {
      data: null,
      count: null,
      error: {
        message: e.message,
        code: '-1',
        name: 'Error',
        stack: e.stack,
        details: '',
        hint: '',
      } as PostgrestError,
    }
  }
}
