'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@kyrra/shared'
import type { UserLabel } from '@kyrra/shared'

export async function getLabels(): Promise<ActionResult<UserLabel[]>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: { code: 'AUTH_ERROR', message: 'Not authenticated' } }
  }

  const { data: labels, error } = await supabase
    .from('user_labels')
    .select('*')
    .eq('user_id', user.id)
    .order('position', { ascending: true })

  if (error) {
    return { data: null, error: { code: 'DB_ERROR', message: error.message } }
  }

  return { data: labels ?? [], error: null }
}
