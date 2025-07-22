declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT?: string
      NODE_ENV: 'development' | 'production' | 'test'
      SUPABASE_JWT_SECRET: string

      EXPO_PUBLIC_URL: string
      NEXT_PUBLIC_URL: string

      EXPO_PUBLIC_SUPABASE_URL: string
      NEXT_PUBLIC_SUPABASE_URL: string

      EXPO_PUBLIC_SUPABASE_ANON_KEY: string
      NEXT_PUBLIC_SUPABASE_ANON_KEY: string
      NEXT_PUBLIC_SUPABASE_PROJECT_ID: string
      NEXT_PUBLIC_SUPABASE_GRAPHQL_URL: string
      NEXT_PUBLIC_MAINNET_RPC_URL: string
      /**
       * The URL of the ERC 4337 Account Abstraction Bundler RPC endpoint
       */
      BUNDLER_RPC_URL: string
      /**
       * The URL of the Base network RPC endpoint
       */
      NEXT_PUBLIC_BASE_RPC_URL: string
      NEXT_PUBLIC_BUNDLER_RPC_URL: string
      SUPABASE_DB_URL: string
      SUPABASE_SERVICE_ROLE: string
      NEXT_PUBLIC_MAINNET_CHAIN_ID: string
      NEXT_PUBLIC_BASE_CHAIN_ID: string
      SNAPLET_HASH_KEY: string
      /**
       * Private key for the Secret Shop wallet client used to fund accounts on testnet and localnet.
       */
      SECRET_SHOP_PRIVATE_KEY: string
      /**
       * Private key for the Send Account Factory wallet client used to create Send Accounts
       */
      SEND_ACCOUNT_FACTORY_PRIVATE_KEY: string
      /**
       * Enables the query dev tool in the browser
       */
      NEXT_PUBLIC_ENABLE_QUERY_DEV_TOOLS: string
      /**
       * Cloudflare Turnstile site key
       */
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: string
      /**
       * Temporal Cloud certification for workers and api
       * Base64 encoded
       */
      TEMPORAL_MTLS_TLS_CERT: string
      /**
       * Temporal Cloud key
       * Base64 encoded
       */
      TEMPORAL_MTLS_TLS_KEY: string
      /**
       * Temporal Cloud namespace
       */
      TEMPORAL_NAMESPACE: string

      /**
       * Kyberswap aggregator API URL for base mainnet
       */
      NEXT_PUBLIC_KYBER_SWAP_BASE_URL: string

      /**
       * Kyberswap clientId, a stricter rate limit will be applied if a clientId is not provided
       */
      NEXT_PUBLIC_KYBER_CLIENT_ID: string

      /**
       * Intercom app id
       */
      NEXT_PUBLIC_INTERCOM_APP_ID: string
    }
  }
  /**
   * This variable is set to true when react-native is running in Dev mode
   * @example
   * if (__DEV__) console.log('Running in dev mode')
   */
  const __DEV__: boolean
  interface Window {
    ethereum: IWeb3Provider
  }
}

export type {}
