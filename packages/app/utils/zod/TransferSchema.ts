import { formFields } from 'app/utils/SchemaForm'

import { z } from 'zod'

export const TransferSchema = z.object({
  amount: formFields.text,
  token: formFields.coin,
  note: formFields.note,
})
