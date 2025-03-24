import { z } from 'zod'
import { decimalStrToBigInt } from '../bigint'
import { byteaToHexEthAddress } from '../bytea'
import { BaseEventSchema } from './BaseEventSchema'
import { Events } from './events'
import { OnchainEventDataSchema } from './OnchainDataSchema'

/**
 * Base Schema for Send Earn event data
 * Consolidated with fields from the feature-specific schema
 */
const SendEarnBaseDataSchemaRaw = OnchainEventDataSchema.extend({
  /**
   * The owner of the Send Earn shares
   */
  owner: byteaToHexEthAddress,
  /**
   * The sender address (originator of the deposit or withdrawal)
   */
  sender: byteaToHexEthAddress,
  /**
   * The amount of assets
   */
  assets: decimalStrToBigInt,
  /**
   * The amount of shares
   */
  shares: decimalStrToBigInt,
})

export const SendEarnBaseDataSchema = SendEarnBaseDataSchemaRaw

/**
 * Schema for Send Earn Deposit events
 */
export const SendEarnDepositDataSchema = SendEarnBaseDataSchemaRaw.extend({})

export const SendEarnDepositEventSchema = BaseEventSchema.extend({
  event_name: z.literal(Events.SendEarnDeposit),
  data: SendEarnDepositDataSchema,
})

export type SendEarnDepositEvent = z.infer<typeof SendEarnDepositEventSchema>

/**
 * Schema for Send Earn Withdraw events
 */
export const SendEarnWithdrawDataSchema = SendEarnBaseDataSchemaRaw.extend({
  /**
   * The receiver address (destination of the withdrawal)
   */
  receiver: byteaToHexEthAddress,
})

export const SendEarnWithdrawEventSchema = BaseEventSchema.extend({
  event_name: z.literal(Events.SendEarnWithdraw),
  data: SendEarnWithdrawDataSchema,
})

export type SendEarnWithdrawEvent = z.infer<typeof SendEarnWithdrawEventSchema>

export type SendEarnEvent = SendEarnDepositEvent | SendEarnWithdrawEvent
export const isSendEarnDepositEvent = (event: {
  event_name: string
}): event is SendEarnDepositEvent => event.event_name === Events.SendEarnDeposit

export const isSendEarnWithdrawEvent = (event: {
  event_name: string
}): event is SendEarnWithdrawEvent => event.event_name === Events.SendEarnWithdraw

export const isSendEarnEvent = (event: {
  event_name: string
}): event is SendEarnDepositEvent | SendEarnWithdrawEvent =>
  isSendEarnDepositEvent(event) || isSendEarnWithdrawEvent(event)
