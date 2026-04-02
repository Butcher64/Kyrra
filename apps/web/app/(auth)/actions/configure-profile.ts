'use server'

import { createClient } from '@/lib/supabase/server'

interface ProfileConfig {
  sector: string
  company_description: string
  prospection_utile: string
  prospection_non_sollicitee: string
  interests: string
  user_role: string
}

export async function saveProfile(
  profile: ProfileConfig,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('user_settings')
    .update({
      sector: profile.sector,
      company_description: profile.company_description,
      prospection_utile: profile.prospection_utile,
      prospection_non_sollicitee: profile.prospection_non_sollicitee,
      interests: profile.interests,
      user_role: profile.user_role,
      profile_configured: true,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)

  if (error) {
    console.error('Failed to save profile:', error)
    return { success: false, error: 'Failed to save profile' }
  }

  return { success: true }
}

export async function getProfile(): Promise<ProfileConfig | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data } = await supabase
    .from('user_settings')
    .select('sector, company_description, prospection_utile, prospection_non_sollicitee, interests, user_role')
    .eq('user_id', user.id)
    .maybeSingle()

  return data ?? null
}
