import { z } from 'zod'
import { BaseEventSchema } from './BaseEventSchema'
import { ReferralsEventSchema } from './ReferralsEventSchema'
import { SendAccountReceiveEventSchema } from './SendAccountReceiveEventSchema'
import { SendAccountSigningKeyAddedEventSchema } from './SendAccountSigningKeyAddedEventSchema'
import { SendAccountSigningKeyRemovedEventSchema } from './SendAccountSigningKeyRemovedEventSchema'
import { SendAccountTransfersEventSchema } from './SendAccountTransfersEventSchema'
import {
  SendEarnDepositEventSchema,
  SendEarnWithdrawEventSchema,
  TemporalSendEarnDepositEventSchema,
} from './SendEarnEventSchema'
import { TagReceiptsEventSchema } from './TagReceiptsEventSchema'
import { TagReceiptUSDCEventSchema } from './TagReceiptUSDCEventSchema'
import { TemporalTransfersEventSchema } from './TemporalTransfersEventSchema'

export type { BaseEvent } from './BaseEventSchema'
export { Events } from './events'
export { isReferralsEvent, ReferralsEventSchema } from './ReferralsEventSchema'
export {
  isSendAccountReceiveEvent,
  SendAccountReceiveEventSchema,
} from './SendAccountReceiveEventSchema'
export {
  isSendAccountTransfersEvent,
  isSendtagCheckoutEvent,
  isSendTokenUpgradeEvent,
  SendAccountTransfersEventSchema,
  type SendAccountTransfersEvent,
} from './SendAccountTransfersEventSchema'
export {
  isSendEarnDepositEvent,
  isSendEarnEvent,
  isSendEarnWithdrawEvent,
  isTemporalSendEarnDepositEvent,
  SendEarnDepositEventSchema,
  SendEarnWithdrawEventSchema,
  TemporalSendEarnDepositEventSchema,
  type SendEarnDepositEvent,
  type SendEarnWithdrawEvent,
  type TemporalSendEarnDepositEvent,
} from './SendEarnEventSchema'
export { isTagReceiptsEvent, TagReceiptsEventSchema } from './TagReceiptsEventSchema'
export { isTagReceiptUSDCEvent, TagReceiptUSDCEventSchema } from './TagReceiptUSDCEventSchema'

export const EventSchema = z
  .discriminatedUnion('event_name', [
    SendAccountTransfersEventSchema,
    TagReceiptsEventSchema,
    TagReceiptUSDCEventSchema,
    ReferralsEventSchema,
    SendAccountReceiveEventSchema,
    TemporalTransfersEventSchema,
    SendEarnDepositEventSchema,
    SendEarnWithdrawEventSchema,
    TemporalSendEarnDepositEventSchema,
    SendAccountSigningKeyAddedEventSchema,
    SendAccountSigningKeyRemovedEventSchema,
  ])
  .or(BaseEventSchema)
  .catch((ctx) => {
    console.warn('Error parsing event', ctx, ctx.error)
    // this is only required since the discrimnated union hard errors when a non-matching event is passed
    // if an unknown event is found, we should return a generic event
    if (ctx.error.name === 'ZodError') {
      const { issues } = ctx.error
      if (issues.some((i) => i.code === 'invalid_union_discriminator')) {
        return BaseEventSchema.parse(ctx.input)
      }
    }
    // If we can't handle the error, just return a generic event
    return BaseEventSchema.parse(ctx.input)
  })

export type Activity = z.infer<typeof EventSchema>

export const EventArraySchema = z.array(EventSchema)
