import { formFields } from 'app/utils/SchemaForm'
import { z } from 'zod'

export const CheckoutTagSchema = z.object({
  name: formFields.text
    .min(1)
    .max(20)
    // English alphabet, numbers, and underscore
    .regex(/^[a-zA-Z0-9_]+$/, 'Only English alphabet, numbers, and underscore'),
})
