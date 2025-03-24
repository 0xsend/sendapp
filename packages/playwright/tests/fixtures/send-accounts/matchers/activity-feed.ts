import type { Database } from '@my/supabase/database-generated.types'
import { expect } from '@playwright/test'
import type { SupabaseClient } from '@supabase/supabase-js'
import { assert } from 'app/utils/assert'
import type { Activity } from 'app/utils/zod/activity'

type PartialActivityUser = Partial<Activity['from_user']>
export type ActivityMatch = Pick<Activity, 'event_name' | 'data'> & {
  from_user?: PartialActivityUser
  to_user?: PartialActivityUser
}

expect.extend({
  /**
   * Given a user authenticated supabase client and an activity event. Asserts that the activity event is the **latest** activity feed.
   */
  async toHaveEventInActivityFeed(supabase: SupabaseClient<Database>, activity: ActivityMatch) {
    const {
      data: activityFeed,
      count,
      error,
    } = await supabase
      .from('activity_feed')
      .select('*', { count: 'exact' })
      .eq('event_name', activity.event_name)
      .order('created_at', { ascending: false })

    assert(!!activityFeed, 'activity feed not found')
    expect(error).toBeFalsy()
    expect(count, 'activity feed is empty').toBeGreaterThan(0)

    const errors: string[] = []
    for (const event of activityFeed) {
      if (event.event_name === activity.event_name) {
        try {
          expect(event.data as object).toMatchObject(activity.data)
        } catch (e) {
          if ((e as unknown as { matcherResult: { message: string } }).matcherResult) {
            errors.push(e.matcherResult.message)
          }
          continue
        }

        return {
          pass: true,
          message: () => 'Activity event is in the activity feed',
        }
      }
    }

    return {
      pass: false,
      message: () => `Activity ${activity.event_name} is not in the activity feed with errors:
${errors.join('\n')}`,
    }
  },
})

declare global {
  namespace PlaywrightTest {
    interface Matchers<R> {
      /**
       * Given a user authenticated supabase client and an activity event. Asserts that the activity event is in the activity feed.
       */
      toHaveEventInActivityFeed(activity: ActivityMatch): Promise<R>
    }
  }
}
