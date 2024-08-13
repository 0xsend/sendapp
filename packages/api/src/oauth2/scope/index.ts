import type {
  GrantIdentifier,
  OAuthClient,
  OAuthScope,
  OAuthScopeRepository,
} from '@jmondi/oauth2-server/index'
import { getScopesFromName } from 'src/oauth2/scope/utils'

/**
 * OAuthScopeRepository
 * https://tsoauth2server.com/docs/getting_started/repositories#scope-repository
 */
class SendOAuthScopeRepository implements OAuthScopeRepository {
  async getAllByIdentifiers(scopeNames: string[]): Promise<OAuthScope[]> {
    const scopes: OAuthScope[] = []
    for (const scopeName of scopeNames) {
      const scope = await getScopesFromName(scopeName)
      scopes.push(...scope)
    }
    return scopes
  }

  async finalize(
    scopes: OAuthScope[],
    identifier: GrantIdentifier,
    client: OAuthClient,
    user_id?: string
  ): Promise<OAuthScope[]> {
    return scopes
  }
}
