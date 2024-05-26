import { z } from 'zod'
import { SendAccountTransfersEventSchema } from './SendAccountTransfersEventSchema'
import { TagReceiptsEventSchema } from './TagReceiptsEventSchema'

export const EventSchema = z.discriminatedUnion('event_name', [
  SendAccountTransfersEventSchema,
  TagReceiptsEventSchema,
])

export const EventArraySchema = z.array(EventSchema)
