/**
 * WebAuthn Authenticator: An API for accessing Public Key Credentials
 * @see https://www.w3.org/TR/webauthn-2/
 *
 * This is a mock implementation of the WebAuthn API for use in Playwright tests. It only supports ES256 and P-256.
 */
import { CredentialCreationOptionsSerialized, PublicKeyCredentialAttestationSerialized, CredentialRequestOptionsSerialized, PublicKeyCredentialAssertionSerialized, WebauthnCredential } from './types';
export declare const COSE_PUB_KEY_ALG = -7;
export declare const CredentialsStore: {
    [key: string]: WebauthnCredential;
};
/**
 * Creates a new public key credential for WebAuthn compatible with navigator.credentials.create.
 * This version returns a serialized version of the credential instead of array buffers.
 * This is useful when mocking the WebAuthn API in a browser and is meant to be used in Playwright tests exposed via
 * context.exposeFunction or page.exposeFunction.
 * @see https://www.w3.org/TR/webauthn-2/#sctn-createCredential
 * @see https://www.w3.org/TR/webauthn-2/#sctn-generating-an-attestation-object
 */
export declare function createPublicKeyCredential(credentialOptions: CredentialCreationOptionsSerialized): Promise<PublicKeyCredentialAttestationSerialized>;
/**
 * Gets a public key credential for WebAuthn compatible with navigator.credentials.get.
 * This version returns a serialized version of the credential instead of array buffers.
 * This is useful when mocking the WebAuthn API in a browser and is meant to be used in Playwright tests exposed via
 * context.exposeFunction or page.exposeFunction.
 * @see https://www.w3.org/TR/webauthn-2/#sctn-getCredential
 * @see https://www.w3.org/TR/webauthn-2/#sctn-verifying-assertion
 */
export declare function getPublicKeyCredential(credentialRequestOptions: CredentialRequestOptionsSerialized): Promise<PublicKeyCredentialAssertionSerialized>;
