import type { UserLabel } from '@kyrra/shared'

export interface UserProfile {
  userRole: string
  exposureMode: string
  sector?: string
  companyDescription?: string
  prospectionUtile?: string
  prospectionNonSollicitee?: string
  interests?: string
}

/**
 * Build the LLM system prompt dynamically from a user's labels + profile.
 * Each label's prompt is injected as a classification option.
 * User profile context helps the AI judge relevance of prospection emails.
 */
export function buildSystemPrompt(
  labels: UserLabel[],
  profile: UserProfile,
): string {
  // B8.4: fail fast if no labels — LLM cannot classify without options
  if (!labels || labels.length === 0) {
    throw new Error('buildSystemPrompt: labels array is empty — cannot build classification prompt')
  }

  const labelInstructions = labels
    .sort((a, b) => a.position - b.position)
    .map((label, i) => `${i + 1}. "${label.name}": ${label.prompt}`)
    .join('\n')

  // Build user context section from profile
  const contextLines = [`- Role: ${profile.userRole} (business decision-maker)`]
  contextLines.push(`- Exposure mode: ${profile.exposureMode}`)

  if (profile.sector) {
    contextLines.push(`- Industry: ${profile.sector}`)
  }
  if (profile.companyDescription) {
    contextLines.push(`- Company: ${profile.companyDescription}`)
  }
  if (profile.interests) {
    contextLines.push(`- Professional interests: ${profile.interests}`)
  }

  // Build prospection guidance
  let prospectionGuidance = ''
  if (profile.prospectionUtile || profile.prospectionNonSollicitee) {
    prospectionGuidance = '\n\nPROSPECTION RELEVANCE GUIDE (from the user):'
    if (profile.prospectionUtile) {
      prospectionGuidance += `\n- USEFUL prospection for this user: ${profile.prospectionUtile}`
    }
    if (profile.prospectionNonSollicitee) {
      prospectionGuidance += `\n- UNWANTED prospection for this user: ${profile.prospectionNonSollicitee}`
    }
    prospectionGuidance += '\nUse this to decide between useful and unwanted prospection labels.'
  }

  return `You are Kyrra, an AI email classification system for B2B professionals.
Classify the incoming email into exactly ONE of the following labels:

${labelInstructions}

User context:
${contextLines.join('\n')}${prospectionGuidance}

CRITICAL RULES:
- Transactional/service emails (auth, billing, security, OTP) must go to the label for transactional content — NEVER to prospection or spam labels.
- Known contacts should go to the label for important/personal emails.
- When in doubt, prefer the label that surfaces the email to the user rather than hiding it.
- A false negative (missing a real email) is far worse than a false positive (showing noise).

Respond with ONLY a JSON object:
{
  "label": "<exact label name from the list above>",
  "confidence": 0.0 to 1.0,
  "summary": "One-line functional summary in the email's language (FR or EN). No PII."
}`
}
