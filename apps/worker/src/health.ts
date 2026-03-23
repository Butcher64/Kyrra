/**
 * Worker Healthcheck — simple HTTP endpoint for uptime monitoring
 *
 * Source: [epics-beta.md — B5.2]
 */

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'

const HEALTH_PORT = parseInt(process.env.HEALTH_PORT ?? '8089', 10)

let workerStartedAt: Date | null = null

/**
 * Mark the worker as started (called from index.ts)
 */
export function markWorkerStarted(): void {
  workerStartedAt = new Date()
}

/**
 * Start a lightweight HTTP healthcheck server
 * Returns { status: 'ok', uptime_s, started_at } on GET /health
 */
export function startHealthServer(): void {
  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    if (req.method === 'GET' && (req.url === '/health' || req.url === '/')) {
      const uptimeSeconds = workerStartedAt
        ? Math.floor((Date.now() - workerStartedAt.getTime()) / 1000)
        : 0

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        status: 'ok',
        uptime_s: uptimeSeconds,
        started_at: workerStartedAt?.toISOString() ?? null,
      }))
      return
    }

    res.writeHead(404)
    res.end('Not found')
  })

  server.listen(HEALTH_PORT, () => {
    console.log(`Healthcheck server listening on port ${HEALTH_PORT}`)
  })
}
