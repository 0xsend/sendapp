import type { PublicKeyCredentialAttestationSerialized, PublicKeyCredentialAssertionSerialized } from './types';
/**
 * Deserialize a serialized public key credential attestation into a PublicKeyCredential.
 */
export declare function deserializePublicKeyCredentialAttestion(credential: PublicKeyCredentialAttestationSerialized): PublicKeyCredential & {
    response: AuthenticatorAttestationResponse;
};
/**
 * Deserialize a serialized public key credential assertion into a PublicKeyCredential.
 */
export declare function deserializePublicKeyCredentialAssertion(credential: PublicKeyCredentialAssertionSerialized): PublicKeyCredential & {
    response: AuthenticatorAssertionResponse;
};
