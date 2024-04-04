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
      NEXT_PUBLIC_BASE_RPC_URL: string
      NEXT_PUBLIC_BUNDLER_RPC_URL: string
      SUPABASE_DB_URL: string
      SUPABASE_SERVICE_ROLE: string
      NEXT_PUBLIC_MAINNET_CHAIN_ID: string
      NEXT_PUBLIC_BASE_CHAIN_ID: string
      SNAPLET_HASH_KEY: string
    }
  }
  /**
   * This variable is set to true when react-native is running in Dev mode
   * @example
   * if (__DEV__) console.log('Running in dev mode')
   */
  const __DEV__: boolean
}

export type {}
