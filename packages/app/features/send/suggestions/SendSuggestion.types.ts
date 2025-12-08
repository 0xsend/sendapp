import type { z } from 'zod'
import type { UserSchema } from 'app/utils/zod/activity/UserSchema'
import type { UseInfiniteQueryResult, InfiniteData } from '@tanstack/react-query'

export type SendSuggestionItem = z.infer<typeof UserSchema>
export type SendSuggestionsQueryResult = UseInfiniteQueryResult<InfiniteData<SendSuggestionItem[]>>
