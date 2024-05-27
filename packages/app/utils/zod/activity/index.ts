import { z } from 'zod'
import { SendAccountTransfersEventSchema } from './SendAccountTransfersEventSchema'
import { TagReceiptsEventSchema } from './TagReceiptsEventSchema'
import { BaseEventSchema } from './BaseEventSchema'
import { ReferralsEventSchema } from './ReferralsEventSchema'

export { isSendAccountTransfersEvent } from './SendAccountTransfersEventSchema'
export { isTagReceiptsEvent } from './TagReceiptsEventSchema'

export const EventSchema = z
  .discriminatedUnion('event_name', [
    SendAccountTransfersEventSchema,
    TagReceiptsEventSchema,
    ReferralsEventSchema,
  ])
  .or(BaseEventSchema)

export type Activity = z.infer<typeof EventSchema>

export const EventArraySchema = z.array(EventSchema)
