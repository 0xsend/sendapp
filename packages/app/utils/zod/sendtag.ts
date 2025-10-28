import { z } from 'zod'
import { formFields } from '../SchemaForm'

export const SendtagSchema = z.object({
  name: formFields.text
    .min(1)
    .max(20)
    .trim()
    // English alphabet, numbers, and underscore
    .regex(/^[a-zA-Z0-9_]+$/, 'Only English alphabet, numbers, and underscore'),
})

export const FirstSendtagSchema = z.object({
  name: formFields.text
    .min(5, 'First Sendtag must be at least 5 characters')
    .max(20)
    .trim()
    // English alphabet, numbers, and underscore
    .regex(/^[a-zA-Z0-9_]+$/, 'Only English alphabet, numbers, and underscore'),
})
