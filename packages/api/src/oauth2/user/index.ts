import type {
  GrantIdentifier,
  OAuthClient,
  OAuthUser,
  OAuthUserRepository,
} from '@jmondi/oauth2-server/index'
import { supabaseAdmin } from 'app/utils/supabase/admin'
import debug from 'debug'

const logger = debug.log

/**
 * OAuthUserRepository
 *
 * {@link https://tsoauth2server.com/docs/getting_started/repositories/#user-repository}
 */
class SendOAuthUserRepository implements OAuthUserRepository {
  async getUserByCredentials(
    identifier: string,
    password?: string,
    grantType?: GrantIdentifier,
    client?: OAuthClient
  ): Promise<OAuthUser | undefined> {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, name, send_id')
      .eq('id', identifier)
      .single()
    if (error) {
      logger(`Error retrieving user from identifier: [${identifier}]. ${error}`)
      throw error
    }
    return data
  }
}
