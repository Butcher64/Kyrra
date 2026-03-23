import { z } from 'zod'

export const feedbackParamsSchema = z.object({
  gmail_message_id: z.string().min(1),
  reason: z.enum(['false_positive', 'wrong_category', 'whitelist_sender']),
})

export type FeedbackParams = z.infer<typeof feedbackParamsSchema>
