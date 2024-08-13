import type { GrantIdentifier, OAuthClient, OAuthClientRepository } from '@jmondi/oauth2-server'
import { getClient, clientExists, clientHasGrantType } from 'src/oauth2/client/utils'

class SendOAuthClientRepository implements OAuthClientRepository {
  /**
   * Gets client from client id
   * @param {string} identifier - client identifier (`client_id`)
   * @returns {Promise<OAuthClient>} - OAuthClient object
   */
  async getByIdentifier(identifier: string): Promise<OAuthClient> {
    return await getClient(identifier)
  }

  /**
   * Checks if the client is valid. The client is valid if:
   * - The client exists
   * - AND the client is authorized for the requested grant type
   * @param {GrantIdentifier} grantType - requested grant type
   * @param {OAuthClient} client - client
   * @param {string | undefined} clientSecret - client secret (not required as we are using PKCE) @see {https://tsoauth2server.com/docs/grants/authorization_code}
   * @returns {Promise<boolean>}
   */
  async isClientValid(
    grantType: GrantIdentifier,
    client: OAuthClient,
    clientSecret?: string
  ): Promise<boolean> {
    const doesClientExist = await clientExists(client.id)
    if (!doesClientExist) {
      return false
    }
    const clientHasAuthorizationGrantType: boolean = await clientHasGrantType(client.id, grantType)
    if (!clientHasAuthorizationGrantType) {
      return false
    }
    return true
  }
}
