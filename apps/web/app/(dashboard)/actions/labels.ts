'use server'

import { createClient } from '@/lib/supabase/server'
import { ERROR_CODES } from '@kyrra/shared'
import type { ActionResult } from '@kyrra/shared'

const KYRRA_LABELS = [
  { key: 'A_VOIR', name: 'Kyrra/À voir', description: 'Emails à examiner — potentiellement pertinents' },
  { key: 'FILTRE', name: 'Kyrra/Filtré', description: 'Prospection filtrée — pas urgente' },
  { key: 'BLOQUE', name: 'Kyrra/Bloqué', description: 'Spam et prospection indésirable' },
]

export async function getLabels(): Promise<ActionResult<typeof KYRRA_LABELS>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Not authenticated' } }
  }

  return { data: KYRRA_LABELS, error: null }
}
