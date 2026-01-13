import { z } from 'zod'

export const CreateKycLinkInputSchema = z.object({
  redirectUri: z.string().optional(),
  email: z.string().email().optional(),
})

export const GetKycStatusInputSchema = z.object({
  kycLinkId: z.string().min(1),
})

export const CreateKycLinkOutputSchema = z.object({
  kycLink: z.string(),
  tosLink: z.string(),
  kycLinkId: z.string(),
})

export const GetKycStatusOutputSchema = z.object({
  kycStatus: z.string(),
  tosStatus: z.string(),
  rejectionReasons: z.array(z.unknown()).nullable(),
  rejectionAttempts: z.number(),
  customerId: z.string().nullable(),
})

export const CreateVirtualAccountOutputSchema = z.object({
  virtualAccountId: z.string(),
  bankDetails: z.object({
    bankName: z.string().nullable(),
    routingNumber: z.string().nullable(),
    accountNumber: z.string().nullable(),
    beneficiaryName: z.string().nullable(),
    beneficiaryAddress: z.string().nullable(),
    paymentRails: z.array(z.string()),
  }),
})

export const CreateTransferTemplateOutputSchema = z.object({
  templateId: z.string(),
  bankDetails: z.object({
    bankName: z.string().nullable(),
    routingNumber: z.string().nullable(),
    accountNumber: z.string().nullable(),
    beneficiaryName: z.string().nullable(),
    beneficiaryAddress: z.string().nullable(),
    depositMessage: z.string().nullable(),
    paymentRails: z.array(z.string()),
  }),
})

export const CreateStaticMemoOutputSchema = z.object({
  staticMemoId: z.string(),
  bankDetails: z.object({
    bankName: z.string().nullable(),
    routingNumber: z.string().nullable(),
    accountNumber: z.string().nullable(),
    beneficiaryName: z.string().nullable(),
    beneficiaryAddress: z.string().nullable(),
    depositMessage: z.string().nullable(),
    paymentRails: z.array(z.string()),
  }),
})

export type CreateKycLinkInput = z.infer<typeof CreateKycLinkInputSchema>
export type GetKycStatusInput = z.infer<typeof GetKycStatusInputSchema>
export type CreateKycLinkOutput = z.infer<typeof CreateKycLinkOutputSchema>
export type GetKycStatusOutput = z.infer<typeof GetKycStatusOutputSchema>
export type CreateVirtualAccountOutput = z.infer<typeof CreateVirtualAccountOutputSchema>
export type CreateTransferTemplateOutput = z.infer<typeof CreateTransferTemplateOutputSchema>
export type CreateStaticMemoOutput = z.infer<typeof CreateStaticMemoOutputSchema>
