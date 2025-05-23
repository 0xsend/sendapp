import type { z } from 'zod'
import type { UserSchema } from 'app/utils/zod/activity/UserSchema'
import type { UseQueryResult } from '@tanstack/react-query'

export type SendSuggestionItem = z.infer<typeof UserSchema>
export type SendSuggestionsQueryResult = UseQueryResult<SendSuggestionItem[]>
