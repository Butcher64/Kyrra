/**
 * Startup environment validation (B9.5)
 * Fails fast with a clear error if required env vars are missing.
 * Called once at worker startup, before any loop starts.
 */

interface EnvVar {
  name: string
  required: boolean
  validate?: (value: string) => string | null // returns error message or null
}

const ENV_VARS: EnvVar[] = [
  { name: 'SUPABASE_URL', required: true },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', required: true },
  { name: 'ENCRYPTION_KEY', required: true, validate: (v) => {
    // crypto.ts decodes with Buffer.from(key, 'base64') and expects 32 bytes
    const buf = Buffer.from(v, 'base64')
    if (buf.length !== 32) {
      return 'must be 32 bytes when base64-decoded (44 base64 chars) for AES-256-GCM'
    }
    return null
  }},
  { name: 'GOOGLE_CLIENT_ID', required: true },
  { name: 'GOOGLE_CLIENT_SECRET', required: true },
  { name: 'OPENAI_API_KEY', required: true },
  { name: 'POSTMARK_SERVER_TOKEN', required: true },
  // Optional
  { name: 'GMAIL_PUBSUB_TOPIC', required: false },
  { name: 'ADMIN_ALERT_EMAILS', required: false },
]

/**
 * Validate all required environment variables.
 * Logs missing/invalid vars and throws if any required var is missing.
 */
export function validateEnv(): void {
  const errors: string[] = []
  const warnings: string[] = []

  for (const envVar of ENV_VARS) {
    const value = process.env[envVar.name]

    if (!value || value.trim() === '') {
      if (envVar.required) {
        errors.push(`  ✗ ${envVar.name} — MISSING (required)`)
      } else {
        warnings.push(`  - ${envVar.name} — not set (optional)`)
      }
      continue
    }

    if (envVar.validate) {
      const validationError = envVar.validate(value)
      if (validationError) {
        errors.push(`  ✗ ${envVar.name} — ${validationError}`)
      }
    }
  }

  if (warnings.length > 0) {
    console.log('[ENV] Optional vars not set:\n' + warnings.join('\n'))
  }

  if (errors.length > 0) {
    console.error('[ENV] ❌ Missing or invalid environment variables:\n' + errors.join('\n'))
    throw new Error(`Worker startup failed: ${errors.length} env var(s) missing or invalid`)
  }

  console.log(`[ENV] ✓ All ${ENV_VARS.filter(v => v.required).length} required env vars validated`)
}
