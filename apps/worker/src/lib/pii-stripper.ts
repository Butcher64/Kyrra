/**
 * PII Stripping Pipeline — 3 layers (FR8, FR82)
 * Layer 1: LLM prompt instruction (handled in llm-gateway.ts system prompt)
 * Layer 2: Regex post-processing on returned summaries
 * Layer 3: Art. 9 RGPD sensitive data detection before LLM transmission
 *
 * Target: <0.5% PII leakage rate
 */

// Layer 2: Regex patterns for PII in generated summaries
const PII_PATTERNS = [
  /\b[\w.+-]+@[\w.-]+\.\w+\b/g,                    // Email addresses
  /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}\b/g, // Phone numbers
  /\b\d{1,5}\s[\w\s]+(?:rue|avenue|boulevard|street|road|av\.|bd\.)\b/gi,    // Street addresses
  /\b\d{5,6}\b/g,                                    // Postal codes (FR 5 digits)
  /\b(?:IBAN|FR)\s?\d{2}\s?\d{4}\s?\d{4}/g,         // IBAN patterns
  /\b\d{3}[\s.-]?\d{3}[\s.-]?\d{3}\b/g,             // SIRET-like patterns
]

// Layer 3: Art. 9 RGPD sensitive data patterns (before LLM transmission)
const SENSITIVE_PATTERNS = [
  /\b(?:cancer|maladie|diagnostic|traitement|hôpital|médecin|santé)\b/gi,  // Health
  /\b(?:syndicat|politique|religion|orientation\s+sexuelle)\b/gi,           // Political/religious
  /\b\d{1,3}[\s,.]?\d{3}[\s,.]?\d{0,2}\s?(?:€|EUR|dollars?|USD)\b/gi,    // Financial amounts
]

/**
 * Strip PII from a generated summary (Layer 2)
 * Returns cleaned summary
 */
export function stripPIIFromSummary(summary: string): string {
  let cleaned = summary
  for (const pattern of PII_PATTERNS) {
    cleaned = cleaned.replace(pattern, '[REDACTED]')
  }
  return cleaned
}

/**
 * Detect Art. 9 RGPD sensitive data in email content (Layer 3)
 * Returns true if sensitive data is detected
 */
export function detectSensitiveContent(content: string): boolean {
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(content))
}

/**
 * Sanitize email content before LLM transmission (FR82)
 * Redacts sensitive patterns, preserves structure for classification
 */
export function sanitizeForLLM(content: string): string {
  let sanitized = content
  for (const pattern of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[SENSITIVE_REDACTED]')
  }
  return sanitized
}
