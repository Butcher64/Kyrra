import { createClient } from '@supabase/supabase-js'
import { classificationLoop } from './classification'
import { reconciliationLoop, watchRenewalLoop } from './reconciliation'
import { onboardingScanLoop, inboxScanLoop } from './onboarding'
import { reclassificationLoop } from './reclassification'
import { recapCronLoop } from './recap'
import { monitoringLoop } from './monitoring'
import { startHealthServer, markWorkerStarted } from './health'

let isShuttingDown = false

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...')
  isShuttingDown = true
})

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function resilientLoop(
  name: string,
  fn: () => Promise<void>,
): Promise<never> {
  while (!isShuttingDown) {
    try {
      await fn()
    } catch (error) {
      console.error(`[${name}] Loop error, restarting in 5s...`, error)
      await sleep(5000)
    }
  }
  return undefined as never
}

async function main() {
  console.log('Kyrra worker starting...')

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Start healthcheck HTTP server
  startHealthServer()
  markWorkerStarted()

  // 8 resilient loops — crash in one does NOT kill others
  await Promise.all([
    resilientLoop('classification', () => classificationLoop(supabase)),
    resilientLoop('reclassification', () => reclassificationLoop(supabase)),
    resilientLoop('watchRenewal', () => watchRenewalLoop(supabase)),
    resilientLoop('reconciliation', () => reconciliationLoop(supabase)),
    resilientLoop('onboarding', () => onboardingScanLoop(supabase)),
    resilientLoop('inboxScan', () => inboxScanLoop(supabase)),
    resilientLoop('recap', () => recapCronLoop(supabase)),
    resilientLoop('monitoring', () => monitoringLoop(supabase)),
  ])

  console.log('Worker shut down complete.')
  process.exit(0)
}

main().catch(console.error)

export { isShuttingDown, resilientLoop, sleep }
