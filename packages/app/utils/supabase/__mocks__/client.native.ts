import type { Database } from '@my/supabase/database.types'
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient<Database>('http://localhost:54321', 'mock-supabase-key')

export default {
  supabase,
}
