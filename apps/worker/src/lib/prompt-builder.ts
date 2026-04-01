import type { UserLabel } from '@kyrra/shared'

/**
 * Build the LLM system prompt dynamically from a user's labels.
 * Each label's prompt is injected as a classification option.
 * Called once per classification when LLM is needed.
 */
export function buildSystemPrompt(
  labels: UserLabel[],
  userRole: string,
  exposureMode: string,
): string {
  const labelInstructions = labels
    .sort((a, b) => a.position - b.position)
    .map((label, i) => `${i + 1}. "${label.name}": ${label.prompt}`)
    .join('\n')

  return `You are Kyrra, an AI email classification system for B2B professionals.
Classify the incoming email into exactly ONE of the following labels:

${labelInstructions}

User context:
- Role: ${userRole} (business decision-maker)
- Exposure mode: ${exposureMode}

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
