import { z } from 'zod'
import { SendAccountTransfersEventSchema } from './SendAccountTransfersEventSchema'
import { TagReceiptsEventSchema } from './TagReceiptsEventSchema'

export const EventSchema = z.discriminatedUnion('event_name', [
  SendAccountTransfersEventSchema,
  TagReceiptsEventSchema,
])

export type Activity = z.infer<typeof EventSchema>

export const EventArraySchema = z.array(EventSchema)
