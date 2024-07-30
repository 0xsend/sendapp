import type { GetUserOperationReceiptReturnType } from 'permissionless'
import type { Hex } from 'viem'

/**
 * Represents the data that a /send check holds.
 */
export interface SendCheckData {
  ephemeralAddress: Hex
  amount: bigint
  token: Hex

  // Optional, off-chain data below
  note?: string
}

/**
 * Defines the properties required to create and send a check.
 * @interface CreateSendCheckProps
 * @property {Hex} tokenAddress - The address of the token to be sent.
 * @property {EphemeralKeyPair} ephemeralKeypair - The ephemeral key pair used for the transaction.
 * @property {bigint} amount - The amount of the token to be sent.
 */
export interface CreateSendCheckProps {
  tokenAddress: Hex
  ephemeralKeypair: EphemeralKeyPair
  amount: bigint
}

/**
 * Payload for claiming a send check.
 *
 * See {@link generateCheckUrl} and {@link decodeClaimCheckUrl} for more information on how the payload is encoded for sharing.
 *
 * @interface ClaimSendCheckPayload
 * @property {string} senderSendId - The send ID of the sender's profile {@see profiles table`}.
 * @property {EphemeralKeyPair} ephemeralKeypair - The ephemeral key pair associated with the transaction.
 */
export interface ClaimSendCheckPayload {
  senderSendId: string
  ephemeralKeypair: EphemeralKeyPair
}

/**
 * Properties required for a claiming /send check userOp.
 */
export interface ClaimSendCheckProps extends ClaimSendCheckPayload {
  signature: Hex
}

/**
 * Base properties required for a /send check userOp.
 */
interface SendCheckUserOp {
  maxFeesPerGas: bigint
  senderAddress: Hex
  nonce: bigint
}

/**
 * Properties for creating and sending a check operation, extending the base properties required for check creation.
 *
 * @interface CreateSendCheckUserOpProps
 * @extends CreateSendCheckProps
 * @property {Hex} senderAddress - The address of the sender in hexadecimal format.
 * @property {bigint} nonce - A unique nonce userOp nonce
 */
export interface CreateSendCheckUserOpProps extends SendCheckUserOp, CreateSendCheckProps {}

export interface ClaimSendCheckUserOpProps extends SendCheckUserOp {
  ephemeralKeypair: EphemeralKeyPair
  signature: Hex
}

/**
 * Represents the return type of a function that creates and sends a check.
 * @typedef {Object} CreateSendCheckReturnType
 * @property {GetUserOperationReceiptReturnType} receipt - The receipt of the user operation.
 * @property {string} senderSendId - The send ID of the sender's profile {@see profiles table}.
 * @property {Hex} ephemeralKeypair - The ephemeral keypair used in the operation.
 */
export type CreateSendCheckReturnType = {
  receipt: GetUserOperationReceiptReturnType
  senderSendId: number
  ephemeralKeypair: EphemeralKeyPair
}

export type useCreateSendCheckReturnType = () => Promise<CreateSendCheckReturnType | undefined>

export type useClaimSendCheckReturnType = () => Promise<GetUserOperationReceiptReturnType>

/**
 * Represents an ephemeral key pair sued for creating/claiming /send checks.
 * @interface EphemeralKeyPair
 * @property {`0x${string}`} ephemeralPrivateKey - The private key of the ephemeral key pair, prefixed with `0x`.
 * @property {`0x${string}`} ephemeralAddress - The address derived from the ephemeral key pair, prefixed with `0x`.
 */
export interface EphemeralKeyPair {
  ephemeralPrivateKey: `0x${string}`
  ephemeralAddress: `0x${string}`
}

/**
 * Represents the token metadata shown on the claim /send check page.
 */
export interface TokenMetadata {
  name: string
  imageUrl: string
  coinGeckoTokenId: string
}
