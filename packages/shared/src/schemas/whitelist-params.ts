import { z } from 'zod'

export const whitelistParamsSchema = z.object({
  email_address: z.string().email(),
})

export type WhitelistParams = z.infer<typeof whitelistParamsSchema>
