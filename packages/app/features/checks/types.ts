import type { GetUserOperationReceiptReturnType } from 'permissionless'
import type { Hex } from 'viem'

/**
 * Properties for the CreateSendCheck button component.
 *
 * @interface CreateSendCheckBtnProps
 * @property {bigint} amount - The amount of the token to be sent.
 * @property {Hex} tokenAddress - The address of the token.
 * @property {(senderAccountId: string, ephemeralPrivkey: Hex) => void} onSuccess - Callback function to be called upon successful check creation and sending. Receives the sender's account ID and the ephemeral private key used in the operation.
 * @property {(error: Error) => void} onError - Callback function to be called in case of an error during the check creation or sending process.
 */
export interface CreateSendCheckBtnProps {
  amount: bigint
  tokenAddress: Hex
  onSuccess: (senderAccountId: string, ephemeralKeypair: EphemeralKeyPair) => void
  onError: (error: Error) => void
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
 * Properties for creating and sending a check operation, extending the base properties required for check creation.
 *
 * @interface CreateSendCheckUserOpProps
 * @extends CreateSendCheckProps
 * @property {Hex} senderAddress - The address of the sender in hexadecimal format.
 * @property {bigint} nonce - A unique nonce userOp nonce
 */
export interface CreateSendCheckUserOpProps extends CreateSendCheckProps {
  senderAddress: Hex
  nonce: bigint
}

export type useCreateSendCheckReturnType = () => Promise<CreateSendCheckReturnType>

/**
 * Represents the return type of a function that creates and sends a check.
 * @typedef {Object} CreateSendCheckReturnType
 * @property {GetUserOperationReceiptReturnType} receipt - The receipt of the user operation.
 * @property {string} senderAccountId - The account ID of the sender.
 * @property {Hex} ephemeralPrivkey - The ephemeral private key used in the operation.
 */
export type CreateSendCheckReturnType = {
  receipt: GetUserOperationReceiptReturnType
  senderAccountId: string
  ephemeralKeypair: EphemeralKeyPair
}

/**
 * Represents an ephemeral key pair sued for creating/claiming /send checks.
 * @interface EphemeralKeyPair
 * @property {`0x${string}`} ephemeralPrivkey - The private key of the ephemeral key pair, prefixed with `0x`.
 * @property {`0x${string}`} ephemeralAddress - The address derived from the ephemeral key pair, prefixed with `0x`.
 */
export interface EphemeralKeyPair {
  ephemeralPrivkey: `0x${string}`
  ephemeralAddress: `0x${string}`
}
