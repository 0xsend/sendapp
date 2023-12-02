export { AAGUID } from './aaguid'
export {
  deserializePublicKeyCredentialAttestion,
  deserializePublicKeyCredentialAssertion,
} from './utils'
export type {
  AuthenticatorAssertionResponseSerialized,
  AuthenticatorAttestationResponseSerialized,
  CredentialCreationOptionsSerialized,
  CredentialRequestOptionsSerialized,
  PublicKeyCredentialAssertionSerialized,
  PublicKeyCredentialAttestationSerialized,
  PublicKeyCredentialCreationOptionsSerialized,
  PublicKeyCredentialDescriptorSerialized,
  PublicKeyCredentialRequestOptionsSerialized,
  PublicKeyCredentialUserEntitySerialized,
} from './types'
export {
  CredentialsStore,
  createPublicKeyCredential,
  getPublicKeyCredential,
  COSE_PUB_KEY_ALG,
} from './web-authenticator'

export type * as WebAuthnAuthenticator from './preload'
