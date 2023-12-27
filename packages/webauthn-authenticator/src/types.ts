export interface PublicKeyCredentialUserEntitySerialized
  extends Omit<PublicKeyCredentialUserEntity, 'id'> {
  id: string
}
export interface PublicKeyCredentialCreationOptionsSerialized
  extends Omit<PublicKeyCredentialCreationOptions, 'challenge' | 'user'> {
  challenge: string
  user: PublicKeyCredentialUserEntitySerialized
}
export type CredentialCreationOptionsSerialized = {
  publicKey: PublicKeyCredentialCreationOptionsSerialized
}
export interface AuthenticatorAttestationResponseSerialized
  extends Omit<AuthenticatorAttestationResponse, 'clientDataJSON' | 'attestationObject'> {
  clientDataJSON: string
  attestationObject: string
}
export interface PublicKeyCredentialAttestationSerialized
  extends Omit<PublicKeyCredential, 'response' | 'rawId'> {
  response: AuthenticatorAttestationResponseSerialized
  rawId: string
}
export interface PublicKeyCredentialDescriptorSerialized
  extends Omit<PublicKeyCredentialDescriptor, 'id'> {
  id: string
}
export interface PublicKeyCredentialRequestOptionsSerialized
  extends Omit<PublicKeyCredentialRequestOptions, 'challenge' | 'allowCredentials'> {
  challenge: string
  allowCredentials: PublicKeyCredentialDescriptorSerialized[]
}
export type CredentialRequestOptionsSerialized = {
  publicKey: PublicKeyCredentialRequestOptionsSerialized
}
export interface AuthenticatorAssertionResponseSerialized
  extends Omit<
    AuthenticatorAssertionResponse,
    'clientDataJSON' | 'authenticatorData' | 'signature' | 'userHandle'
  > {
  clientDataJSON: string
  authenticatorData: string
  signature: string
  userHandle: string | null
}
export interface PublicKeyCredentialAssertionSerialized
  extends Omit<PublicKeyCredential, 'response' | 'rawId'> {
  response: AuthenticatorAssertionResponseSerialized
  rawId: string
}
export type CreateWebauthnCredentialOptions = {
  rpId?: string
  userHandle?: ArrayBuffer | null
}

export type WebauthnCredential = {
  id: Buffer
  /**
   * The public key of the credential in DER format.
   */
  publicKey: Buffer
  /**
   * The private key of the credential in PEM format.
   */
  privateKey: string
  /**
   * The sign counter of the credential.
   */
  signCounter: number
  /**
   * The relying-party ID (rpId) of the credential.
   * @see https://www.w3.org/TR/webauthn-2/#rp-id
   */
  rpId: string
  /**
   * The user handle is specified by a Relying Party, as the value of user.id, and used to map a specific public key credential to a specific user account with the Relying Party. Authenticators in turn map RP IDs and user handle pairs to public key credential sources.
   * A user handle is an opaque byte sequence with a maximum size of 64 bytes, and is not meant to be displayed to the user.
   * Here it is stored as a string in base64 format.
   * @see https://www.w3.org/TR/webauthn-2/#user-handle
   */
  userHandle: ArrayBuffer | null
  attestations: Pick<AuthenticatorAttestationResponse, 'clientDataJSON' | 'attestationObject'>[]
  assertions: AuthenticatorAssertionResponse[]
}

export type Attestation = {
  fmt: string
  attStmt: {
    alg: number
    sig: Buffer
  }
  authData: Buffer
}

export type GetWebAuthnCredentialQuery = {
  credentialId?: string
  rpId?: string
}
