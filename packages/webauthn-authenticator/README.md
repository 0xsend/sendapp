# webauthn-authenticator

This is a simple webauthn authenticator for testing p-256 keys. It is meant to mock the calls to `navigator.credentials.create` and `navigator.credentials.get` and return a valid webauthn credential.

## Web Authentication API

The Web Authentication API (WebAuthn) is an extension of the Credential Management API that enables strong authentication with public key cryptography, enabling passwordless authentication and secure multi-factor authentication (MFA) without SMS texts

Read more about the Web Authentication API [here](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API).
