import { z } from 'zod'

export const reclassifyParamsSchema = z.object({
  email_id: z.string().min(1),
  gmail_message_id: z.string().min(1),
  idempotency_key: z.string().min(1),
})

export type ReclassifyParams = z.infer<typeof reclassifyParamsSchema>
