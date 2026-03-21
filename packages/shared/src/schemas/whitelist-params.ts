import { z } from 'zod'

export const whitelistParamsSchema = z.object({
  email_address: z.string().email(),
})

export type WhitelistParams = z.infer<typeof whitelistParamsSchema>

export const removeWhitelistParamsSchema = z.object({
  address_hash: z.string().min(1),
})

export type RemoveWhitelistParams = z.infer<typeof removeWhitelistParamsSchema>
