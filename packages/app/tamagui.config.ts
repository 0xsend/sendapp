import { config } from '@my/ui'

export type Conf = typeof config

declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf {}
}

declare module '@tamagui/toast' {
  interface CustomData {
    theme?: 'error' | 'success'
  }
}

export default config
