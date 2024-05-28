import { z } from 'zod'
import { BaseEventSchema } from './BaseEventSchema'
import { ReferralsEventSchema } from './ReferralsEventSchema'
import { SendAccountTransfersEventSchema } from './SendAccountTransfersEventSchema'
import { TagReceiptsEventSchema } from './TagReceiptsEventSchema'

export { ReferralsEventSchema, isReferralsEvent } from './ReferralsEventSchema'
export {
  SendAccountTransfersEventSchema,
  isSendAccountTransfersEvent,
} from './SendAccountTransfersEventSchema'
export { TagReceiptsEventSchema, isTagReceiptsEvent } from './TagReceiptsEventSchema'
export { Events } from './events'

export const EventSchema = z
  .discriminatedUnion('event_name', [
    SendAccountTransfersEventSchema,
    TagReceiptsEventSchema,
    ReferralsEventSchema,
  ])
  .or(BaseEventSchema)

export type Activity = z.infer<typeof EventSchema>

export const EventArraySchema = z.array(EventSchema)
