import type { GrantIdentifier, OAuthClient, OAuthScope } from '@jmondi/oauth2-server'
import { supabaseAdmin } from 'app/utils/supabase/admin'
import debug from 'debug'

const logger = debug.log

export const getClient = async (clientId: string): Promise<OAuthClient> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('oauth2_clients')
      .select('*')
      .eq('client_id', clientId)
      .single()
    if (error) {
      logger(error)
      throw error
    }
    return {
      id: data.client_id,
      name: data.client_name,
      redirectUris: [data.redirect_uri],
      allowedGrants: await getClientGrants(clientId),
      scopes: await getClientScopes(clientId),
    }
  } catch (error) {
    logger(`Error retrieving client from client id: [${clientId}]. ${error})`)
    throw error
  }
}

export const clientExists = async (clientId: string): Promise<boolean> => {
  const { data, error } = await supabaseAdmin
    .from('oauth2_clients')
    .select('*')
    .eq('client_id', clientId)
    .single()
  if (error) {
    logger(`Unable to determine whether client exists. clientId: [${clientId}]. ${error}`)
    return false
  }
  return !!data
}

export const clientHasGrantType = async (
  clientId: string,
  grantType: GrantIdentifier
): Promise<boolean> => {
  const clientGrants: GrantIdentifier[] = await getClientGrants(clientId)
  return clientGrants.includes(grantType)
}

export const getClientGrants = async (clientId: string): Promise<GrantIdentifier[]> => {
  const { data, error } = await supabaseAdmin
    .from('oauth2_client_authorization_grant_types')
    .select('grant_type')
    .eq('client_id', clientId)
  if (error) {
    logger(error)
    throw error
  }
  return data.map((grant) => grant.grant_type) as GrantIdentifier[]
}

export const getClientScopes = async (clientId: string): Promise<OAuthScope[]> => {
  const { data, error } = await supabaseAdmin
    .from('oauth2_client_scopes')
    .select('name')
    .eq('client_id', clientId)
  if (error) {
    logger(error)
    return []
  }
  return data
}
