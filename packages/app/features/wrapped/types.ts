export interface TopCounterparty {
  name: string
  avatarUrl: string
  sendId: number
  tagName: string | null
}

export interface WrappedData {
  topCounterparties: TopCounterparty[]
  totalTransfers: number
  uniqueRecipients: number
  sendScoreRank: number | null
  fetchedAt: string // ISO timestamp
}

export interface WrappedDataState {
  data: WrappedData | null
  loading: boolean
  error: Error | null
}
