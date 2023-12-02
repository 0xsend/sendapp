import { COSE_PUB_KEY_ALG, type CredentialCreationOptionsSerialized } from '../src'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as cbor from 'cbor'
import * as crypto from 'crypto'

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

      it('should create a credential with mock', async () => {
        const { createPublicKeyCredential } = await import('../src')
        const { deserializePublicKeyCredentialAttestion } = await import('../src/utils')

        const attestationChallenge = Buffer.from('test challenge').toString('base64')

        const credOptSer = {
          publicKey: {
            rp: {
              id: 'send.app',
              name: 'Send',
            },
            user: {
              id: Buffer.from('test user').toString('base64'),
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

        const credSer = await createPublicKeyCredential(credOptSer)

        const cred = deserializePublicKeyCredentialAttestion(credSer)

        expect(cred.rawId).toEqual(testBytes)
        expect(cred.id).toEqual(testBytes.toString('base64'))

        verifyCredChallenge({ cred, attestationChallenge, publicKey: keyPair.publicKey })
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
          createPublicKeyCredential,
          getPublicKeyCredential,
          deserializePublicKeyCredentialAttestion,
        } = await import('../src')

        const attestationChallenge = Buffer.from('test challenge').toString('base64')

        const credOptSer = {
          publicKey: {
            rp: {
              id: 'send.app',
              name: 'Send',
            },
            user: {
              id: Buffer.from('test user').toString('base64'),
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

        const credSer = await createPublicKeyCredential(credOptSer)

        const cred = deserializePublicKeyCredentialAttestion(credSer)

        expect(cred.rawId).toEqual(testBytes)
        expect(cred.id).toEqual(testBytes.toString('base64'))
        verifyCredChallenge({ cred, attestationChallenge, publicKey: keyPair.publicKey })
      })
    })
  })
})

function verifyCredChallenge({
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
  expect(responsePublicKey.toString('hex')).toEqual(publicKey.toString('hex'))
  // verify the attStmt sig against
  const attestation = cbor.decodeAllSync(response.attestationObject)[0]

  expect(attestation).toBeDefined()
  expect(attestation.authData).toBeDefined()
  expect(attestation.authData).toEqual(response.getAuthenticatorData())
  expect(attestation.attStmt).toBeDefined()
  expect(attestation.attStmt.sig).toBeDefined()
  const verified = crypto.verify(
    'sha256',
    Buffer.concat([attestation.authData, response.clientDataJSON]),
    crypto.createPublicKey({
      key: publicKey,
      format: 'der',
      type: 'spki',
    }),
    attestation.attStmt.sig
  )

  expect(verified).toBeTruthy()
}
