'use server'

import { createClient } from '@/lib/supabase/server'

interface LabelConfig {
  name: string
  description: string
  prompt: string
  color: string
  gmail_label_id: string | null
  gmail_label_name: string | null
  is_default: boolean
}

export async function saveLabelsConfig(
  labels: LabelConfig[],
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Not authenticated' }
  if (labels.length < 2) return { success: false, error: 'Minimum 2 labels required' }
  if (labels.length > 15) return { success: false, error: 'Maximum 15 labels' }

  // Atomic delete + insert via RPC (single transaction — no partial failure)
  const { error: rpcError } = await supabase.rpc('save_user_labels', {
    p_labels: labels.map((label) => ({
      name: label.name,
      description: label.description,
      prompt: label.prompt,
      color: label.color,
      gmail_label_id: label.gmail_label_id,
      gmail_label_name: label.gmail_label_name,
      is_default: label.is_default,
    })),
  })

  if (rpcError) {
    console.error('Failed to save labels:', rpcError)
    return { success: false, error: 'Failed to save label configuration' }
  }

  // Mark onboarding as labels_configured — inbox scan depends on this flag
  const { error: onboardingError } = await supabase
    .from('onboarding_scans')
    .update({ labels_configured: true, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)

  if (onboardingError) {
    console.error(
      'Failed to set labels_configured on onboarding_scans:',
      JSON.stringify(onboardingError, null, 2),
      '| user_id:', user.id,
    )
    return {
      success: false,
      error: 'Labels saved but failed to mark configuration complete. Please try again.',
    }
  }

  return { success: true }
}

export async function getOnboardingLabelsData(): Promise<{
  gmailLabels: Array<{ id: string; name: string; color?: any; messagesTotal: number }>
  scanComplete: boolean
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { gmailLabels: [], scanComplete: false }

  const { data: scan } = await supabase
    .from('onboarding_scans')
    .select('status, gmail_labels')
    .eq('user_id', user.id)
    .maybeSingle()

  return {
    gmailLabels: scan?.gmail_labels ?? [],
    scanComplete: scan?.status === 'completed',
  }
}
