import type { Database } from '@my/supabase/database.types'
import { z } from 'zod'
export const temporalUserOpStatus = z.enum([
  'initialized',
  'submitted',
  'sent',
  'confirmed',
  'failed',
  'cancelled',
] as const satisfies readonly Database['temporal']['Enums']['transfer_status'][])
