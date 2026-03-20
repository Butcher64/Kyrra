import { z } from 'zod'
import { CLASSIFICATION_RESULTS } from '../constants/classification'

export const emailClassificationSchema = z.object({
  gmail_message_id: z.string().min(1),
  classification_result: z.enum(CLASSIFICATION_RESULTS),
  confidence_score: z.number().min(0).max(1),
  summary: z.string().nullable().optional(),
  source: z.enum(['fingerprint', 'llm']).default('fingerprint'),
})

export type EmailClassificationInput = z.infer<typeof emailClassificationSchema>
