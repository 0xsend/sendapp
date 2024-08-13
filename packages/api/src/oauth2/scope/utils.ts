import type { OAuthScope } from '@jmondi/oauth2-server/index'
import { supabaseAdmin } from 'app/utils/supabase/admin'
import debug from 'debug'

const logger = debug.log

export const getScopesFromName = async (scopeName: string): Promise<OAuthScope[]> => {
  const { data, error } = await supabaseAdmin
    .from('oauth2_client_scopes')
    .select('*')
    .eq('name', scopeName)
    .limit(1)

  if (error) {
    logger(`Error retrieving scopes from scope name: [${scopeName}]. ${error}`)
    throw error
  }

  return data
}
