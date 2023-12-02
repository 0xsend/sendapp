import crypto from 'crypto'

/**
 * AAGUID is a 128-bit identifier indicating the type (e.g. make and model) of the authenticator.
 */
export const AAGUID = crypto.randomBytes(16)
