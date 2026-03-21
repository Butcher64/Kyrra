import { z } from 'zod'

export const updateExposureModeSchema = z.object({
  exposure_mode: z.enum(['strict', 'normal', 'permissive']),
})

export type UpdateExposureModeParams = z.infer<typeof updateExposureModeSchema>

export const updateNotificationsSchema = z.object({
  notifications_enabled: z.boolean(),
  recap_enabled: z.boolean().optional(),
  recap_time_utc: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
})

export type UpdateNotificationsParams = z.infer<typeof updateNotificationsSchema>
