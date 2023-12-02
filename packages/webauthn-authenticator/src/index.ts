export { AAGUID } from './aaguid'
export { deserializePublicKeyCredentialAttestion } from './utils'
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
  createPublicKeyCredential,
  getPublicKeyCredential,
  COSE_PUB_KEY_ALG,
} from './web-authenticator'
