import { z } from 'zod'
import { VirtualEvents } from './events'
import { SendAccountTransfersEventSchema } from './SendAccountTransfersEventSchema'

export const SendEarnDepositEventSchema = SendAccountTransfersEventSchema.extend({
  event_name: z.literal(VirtualEvents.SendEarnDeposit),
})

export type SendEarnDepositEvent = z.infer<typeof SendEarnDepositEventSchema>

export const isSendEarnDepositEvent = (event: {
  event_name: string
}): event is SendEarnDepositEvent => event.event_name === VirtualEvents.SendEarnDeposit

export const SendEarnWithdrawEventSchema = SendAccountTransfersEventSchema.extend({
  event_name: z.literal(VirtualEvents.SendEarnWithdraw),
})

export type SendEarnWithdrawEvent = z.infer<typeof SendEarnWithdrawEventSchema>

export const isSendEarnWithdrawEvent = (event: {
  event_name: string
}): event is SendEarnWithdrawEvent => event.event_name === VirtualEvents.SendEarnWithdraw

export const isSendEarnEvent = (event: {
  event_name: string
}): event is SendEarnDepositEvent | SendEarnWithdrawEvent =>
  isSendEarnDepositEvent(event) || isSendEarnWithdrawEvent(event)
