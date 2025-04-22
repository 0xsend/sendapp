import * as crypto from 'node:crypto'
import * as cbor from 'cbor2'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  COSE_PUB_KEY_ALG,
  type CredentialCreationOptionsSerialized,
  type CredentialRequestOptionsSerialized,
} from '../src'

describe('Webauthn Credential Functions', () => {
  describe('createPublicKeyCredential', () => {
    describe('with mock', () => {
      const testBytes = Buffer.from('test random bytes')
      const keyPair = {
        publicKey: Buffer.from(
          '3059301306072a8648ce3d020106082a8648ce3d030107034200040ff364eaaac6d529d6d5f197b91b6827278840cd50ffacc5a4c26514f635edc8742deb22ed8c4a336aff7a86d93d6ccb02eb8a85ce2b2a6ea3409b44c574af9a',
          'hex'
        ),
        privateKey: `-----BEGIN EC PRIVATE KEY-----
MHcCAQEEIIB7NZNwk2IztlE2yCbWuPnnom2IqfplB2Wy20hSqxAYoAoGCCqGSM49
AwEHoUQDQgAED/Nk6qrG1SnW1fGXuRtoJyeIQM1Q/6zFpMJlFPY17ch0Lesi7YxK
M2r/eobZPWzLAuuKhc4rKm6jQJtExXSvmg==
-----END EC PRIVATE KEY-----`,
      }
      beforeEach(() => {
        vi.resetModules()
        vi.doMock('crypto', async () => {
          const randomBytes = vi.fn().mockReturnValue(testBytes)
          const generateKeyPairSync = vi.fn().mockReturnValue(keyPair)
          return {
            ...crypto,
            mocked: true,
            randomBytes,
            generateKeyPairSync,
            default: {
              ...crypto,
              mocked: true,
              randomBytes,
              generateKeyPairSync,
            },
          }
        })
      })

      afterEach(() => {
        vi.resetAllMocks()
      })

      it('should create and get a credential with mock', async () => {
        const {
          Authenticator,
          deserializePublicKeyCredentialAttestion,
          deserializePublicKeyCredentialAssertion,
        } = await import('../src')

        const authenticator = new Authenticator()

        const attestationChallenge = Buffer.from('test challenge').toString('base64url')

        const credOptSer = {
          publicKey: {
            rp: {
              id: 'https://send.app',
              name: 'Send',
            },
            user: {
              id: Buffer.from('test user').toString('base64url'),
              name: 'sendusername',
              displayName: 'Send User',
            },
            challenge: attestationChallenge,
            pubKeyCredParams: [
              {
                type: 'public-key',
                alg: -7,
              },
            ],
            timeout: 60000,
          },
        } as CredentialCreationOptionsSerialized

        const credSer = await authenticator.createPublicKeyCredential(credOptSer)

        const cred = deserializePublicKeyCredentialAttestion(credSer)

        expect(new Uint8Array(cred.rawId)).toEqual(new Uint8Array(testBytes))
        expect(cred.id).toEqual(testBytes.toString('base64url'))

        verifyAttestation({ cred, attestationChallenge, publicKey: keyPair.publicKey })

        const credReqOptsSer = {
          publicKey: {
            challenge: attestationChallenge,
            allowCredentials: [
              {
                id: cred.id,
                type: 'public-key',
              },
            ],
            timeout: 60000,
          },
        } as CredentialRequestOptionsSerialized

        const credSer2 = await authenticator.getPublicKeyCredential(credReqOptsSer)
        const cred2 = deserializePublicKeyCredentialAssertion(credSer2)

        verifyAssertion({ cred: cred2, testBytes, keyPair })
      })

      it('should throw exception after calling cancelNextOperation', async () => {
        const { Authenticator } = await import('../src')

        const authenticator = new Authenticator()
        authenticator.cancelNextOperation()

        await expect(
          authenticator.createPublicKeyCredential({} as CredentialCreationOptionsSerialized)
        ).rejects.toThrowError('The operation either timed out or was not allowed.')

        authenticator.cancelNextOperation()

        await expect(
          authenticator.getPublicKeyCredential({} as CredentialRequestOptionsSerialized)
        ).rejects.toThrowError('The operation either timed out or was not allowed.')
      })
    })

    describe('without mock', () => {
      const testBytes = crypto.randomBytes(32)
      const keyPair = crypto.generateKeyPairSync('ec', {
        namedCurve: 'prime256v1',
        publicKeyEncoding: { type: 'spki', format: 'der' },
        privateKeyEncoding: { type: 'sec1', format: 'pem' },
      })

      beforeEach(() => {
        vi.resetModules()
        vi.doMock('crypto', async () => {
          const randomBytes = vi.fn().mockReturnValue(testBytes)
          const generateKeyPairSync = vi.fn().mockReturnValue(keyPair)
          return {
            ...crypto,
            mocked: true,
            randomBytes,
            generateKeyPairSync,
            default: {
              ...crypto,
              mocked: true,
              randomBytes,
              generateKeyPairSync,
            },
          }
        })
      })

      afterEach(() => {
        vi.resetAllMocks()
      })
      it('should create a credential', async () => {
        const {
          Authenticator,
          deserializePublicKeyCredentialAttestion,
          deserializePublicKeyCredentialAssertion,
        } = await import('../src')
        const authenticator = new Authenticator()
        const attestationChallenge = Buffer.from('test challenge').toString('base64url')

        const credOptSer = {
          publicKey: {
            rp: {
              id: 'https://send.app',
              name: 'Send',
            },
            user: {
              id: Buffer.from('test user').toString('base64url'),
              name: 'sendusername',
              displayName: 'Send User',
            },
            challenge: attestationChallenge,
            pubKeyCredParams: [
              {
                type: 'public-key',
                alg: -7,
              },
            ],
            timeout: 60000,
          },
        } as CredentialCreationOptionsSerialized

        const credSer = await authenticator.createPublicKeyCredential(credOptSer)

        const cred = deserializePublicKeyCredentialAttestion(credSer)

        expect(new Uint8Array(cred.rawId)).toEqual(new Uint8Array(testBytes))
        expect(cred.id).toEqual(testBytes.toString('base64url'))
        verifyAttestation({ cred, attestationChallenge, publicKey: keyPair.publicKey })

        const credReqOptsSer = {
          publicKey: {
            challenge: attestationChallenge,
            allowCredentials: [
              {
                id: cred.id,
                type: 'public-key',
              },
            ],
            timeout: 60000,
          },
        } as CredentialRequestOptionsSerialized

        const credSer2 = await authenticator.getPublicKeyCredential(credReqOptsSer)
        const cred2 = deserializePublicKeyCredentialAssertion(credSer2)

        verifyAssertion({ cred: cred2, testBytes, keyPair })
      })

      it('should throw exception after calling cancelNextOperation', async () => {
        const { Authenticator } = await import('../src')

        const authenticator = new Authenticator()
        authenticator.cancelNextOperation()

        await expect(
          authenticator.createPublicKeyCredential({} as CredentialCreationOptionsSerialized)
        ).rejects.toThrowError('The operation either timed out or was not allowed.')

        authenticator.cancelNextOperation()

        await expect(
          authenticator.getPublicKeyCredential({} as CredentialRequestOptionsSerialized)
        ).rejects.toThrowError('The operation either timed out or was not allowed.')
      })
    })
  })
})

async function verifyAssertion({
  cred,
  testBytes,
  keyPair,
}: {
  cred: PublicKeyCredential & { response: AuthenticatorAssertionResponse }
  testBytes: Buffer
  keyPair: { publicKey: Buffer; privateKey: string }
}) {
  expect(new Uint8Array(cred.rawId)).toEqual(new Uint8Array(testBytes))
  expect(cred.id).toEqual(testBytes.toString('base64url'))
  const clientDataHash = Buffer.from(
    await crypto.subtle.digest('SHA-256', cred.response.clientDataJSON)
  )
  const verified = crypto.verify(
    'sha256',
    Buffer.concat([Buffer.from(cred.response.authenticatorData), Buffer.from(clientDataHash)]),
    crypto.createPublicKey({
      key: keyPair.publicKey,
      format: 'der',
      type: 'spki',
    }),
    Buffer.from(cred.response.signature)
  )
  expect(verified).toBeTruthy()
}

async function verifyAttestation({
  cred,
  attestationChallenge,
  publicKey,
}: {
  cred: PublicKeyCredential & { response: AuthenticatorAttestationResponse }
  attestationChallenge: string
  publicKey: Buffer
}) {
  expect(cred).toBeDefined()

  // verify the attestations and clientDataJSON
  const response = cred.response
  expect(response.clientDataJSON).toBeDefined()
  const clientDataHash = Buffer.from(
    await crypto.subtle.digest('SHA-256', cred.response.clientDataJSON)
  )
  expect(JSON.parse(Buffer.from(response.clientDataJSON).toString())).toEqual({
    challenge: attestationChallenge,
    origin: 'https://send.app',
    type: 'webauthn.create',
  })
  // verify public key
  expect(cred.type).toEqual('public-key')
  expect(cred.getClientExtensionResults()).toEqual({})
  expect(cred.response.getTransports()).toEqual(['internal'])
  expect(cred.response.getPublicKeyAlgorithm()).toEqual(COSE_PUB_KEY_ALG)
  // public key needs to be in DER format
  const responsePublicKey = response.getPublicKey()
  expect(responsePublicKey).toBeTruthy()
  // @ts-expect-error - null checked above
  expect(Buffer.from(responsePublicKey).toString('hex')).toEqual(publicKey.toString('hex'))
  // verify the attStmt sig against
  const attestation = cbor.decode<{
    fmt: string
    attStmt: {
      alg: number
      sig: Buffer
    }
    authData: Buffer
  }>(Buffer.from(response.attestationObject))
  expect(attestation).toBeDefined()
  expect(attestation.authData).toBeDefined()
  expect(Buffer.from(attestation.authData).toString('hex')).toEqual(
    Buffer.from(response.getAuthenticatorData()).toString('hex')
  )
  expect(attestation.attStmt).toBeDefined()
  expect(attestation.attStmt.sig).toBeDefined()
  const verified = crypto.verify(
    'sha256',
    Buffer.concat([Buffer.from(attestation.authData), clientDataHash]),
    crypto.createPublicKey({
      key: publicKey,
      format: 'der',
      type: 'spki',
    }),
    Buffer.from(attestation.attStmt.sig)
  )

  expect(verified).toBeTruthy()
}
