# Dynamic Labels & Onboarding Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fixed 3-label classification system (A_VOIR/FILTRE/BLOQUE) with dynamic, user-configurable labels (7 defaults + custom), including a new onboarding wizard that scans Gmail labels and proposes intelligent fusion.

**Architecture:** New `user_labels` table stores each user's label config with AI prompts. The classification pipeline loads user labels at runtime and assembles the LLM system prompt dynamically. The onboarding flow adds a label configuration step between whitelist scan and inbox scan, using cards that show real email examples from the user's Gmail.

**Tech Stack:** TypeScript, Next.js 16, Supabase (Postgres + RLS), Gmail API, GPT-4o-mini, Turborepo monorepo

**Spec:** `docs/superpowers/specs/2026-04-01-dynamic-labels-onboarding-design.md`

---

## File Map

### New files
| File | Responsibility |
|------|---------------|
| `supabase/migrations/023_create_user_labels.sql` | Database schema: user_labels table, email_classifications.label_id column |
| `packages/shared/src/types/user-label.ts` | UserLabel type + DEFAULT_LABELS constant with prompts |
| `apps/worker/src/lib/prompt-builder.ts` | Assemble LLM system prompt dynamically from user labels |
| `apps/worker/src/lib/label-resolver.ts` | Map fingerprint/prefilter ClassificationResult → user label_id |
| `apps/worker/src/lib/gmail-labels.ts` | Gmail API: list user labels, sample emails per label |
| `apps/web/app/(auth)/configure-labels/page.tsx` | Onboarding step: label proposal cards UI |
| `apps/web/app/(auth)/configure-labels/LabelCard.client.tsx` | Interactive label card component |
| `apps/web/app/(auth)/configure-labels/AddLabelModal.client.tsx` | Modal for adding custom labels |
| `apps/web/app/(auth)/actions/configure-labels.ts` | Server action: save label config + create Gmail labels |

### Modified files
| File | Changes |
|------|---------|
| `packages/shared/src/index.ts` | Export new UserLabel type + DEFAULT_LABELS |
| `apps/worker/src/lib/llm-gateway.ts` | Accept labels array, return label name instead of enum |
| `apps/worker/src/classification.ts` | Load user labels, use prompt-builder, save with label_id |
| `apps/worker/src/lib/gmail.ts` | Add listUserLabels(), adapt ensureLabels() for dynamic labels |
| `apps/worker/src/onboarding.ts` | Trigger Gmail label scan, wait for label config before inbox scan |
| `apps/web/app/(auth)/onboarding-progress/page.tsx` | Redirect to /configure-labels after whitelist scan completes |
| `apps/web/app/(dashboard)/dashboard/page.tsx` | Show dynamic labels instead of hardcoded 3 |
| `apps/web/app/(dashboard)/actions/labels.ts` | Read from user_labels table instead of hardcoded array |

---

## Task 1: Database Migration — user_labels table

**Files:**
- Create: `supabase/migrations/023_create_user_labels.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
-- Migration: Create user_labels table for dynamic label system
-- Date: 2026-04-01
-- Purpose: Replace fixed A_VOIR/FILTRE/BLOQUE enum with user-configurable labels

-- 1. Create user_labels table
CREATE TABLE IF NOT EXISTS user_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  prompt TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '#888888',
  gmail_label_id TEXT,
  gmail_label_name TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- 2. RLS policies
ALTER TABLE user_labels ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY user_labels_select ON user_labels
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY user_labels_insert ON user_labels
    FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY user_labels_update ON user_labels
    FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY user_labels_delete ON user_labels
    FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Service role bypass for worker
DO $$ BEGIN
  CREATE POLICY user_labels_service ON user_labels
    FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4. Index for classification pipeline (loads all labels for a user)
CREATE INDEX IF NOT EXISTS idx_user_labels_user ON user_labels(user_id, position);

-- 5. Add label_id to email_classifications (nullable during migration)
ALTER TABLE email_classifications
  ADD COLUMN IF NOT EXISTS label_id UUID REFERENCES user_labels(id);

-- 6. Add labels_configured flag to onboarding_scans
ALTER TABLE onboarding_scans
  ADD COLUMN IF NOT EXISTS labels_configured BOOLEAN NOT NULL DEFAULT false;
```

- [ ] **Step 2: Run the migration**

```bash
SUPABASE_ACCESS_TOKEN=sbp_ef8b2c091beb162759ed5bc99bc5a19d4eb5a690 npx supabase db query --linked -f supabase/migrations/023_create_user_labels.sql
```

Expected: No errors, tables created.

- [ ] **Step 3: Verify table exists**

```bash
SUPABASE_ACCESS_TOKEN=sbp_ef8b2c091beb162759ed5bc99bc5a19d4eb5a690 npx supabase db query --linked "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'user_labels' ORDER BY ordinal_position"
```

Expected: All columns listed (id, user_id, name, description, prompt, color, gmail_label_id, gmail_label_name, is_default, position, created_at, updated_at).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/023_create_user_labels.sql
git commit -m "feat: add user_labels table for dynamic label system"
```

---

## Task 2: Shared Types — UserLabel + DEFAULT_LABELS

**Files:**
- Create: `packages/shared/src/types/user-label.ts`
- Modify: `packages/shared/src/index.ts`

- [ ] **Step 1: Create UserLabel type and DEFAULT_LABELS**

Create `packages/shared/src/types/user-label.ts`:

```typescript
export interface UserLabel {
  id: string
  user_id: string
  name: string
  description: string
  prompt: string
  color: string
  gmail_label_id: string | null
  gmail_label_name: string | null
  is_default: boolean
  position: number
}

/**
 * 7 default Kyrra labels with pre-built AI prompts.
 * Used during onboarding to seed user_labels for new users.
 * Each prompt is injected into the LLM system prompt for classification.
 */
export const DEFAULT_LABELS: Omit<UserLabel, 'id' | 'user_id' | 'gmail_label_id' | 'gmail_label_name'>[] = [
  {
    name: 'Important',
    description: 'Contacts connus, emails directs, réponses personnelles',
    prompt: 'Emails from known contacts, direct personal correspondence, replies in ongoing conversations. The sender is someone the user has previously communicated with.',
    color: '#2e7d32',
    is_default: true,
    position: 0,
  },
  {
    name: 'Transactionnel',
    description: 'Factures, paiements, auth, alertes sécurité',
    prompt: 'Transactional and service emails: invoices, payment confirmations, payment failures, authentication codes (OTP, 2FA), password resets, security alerts, account management notifications, subscription renewals, delivery tracking, receipts.',
    color: '#1565c0',
    is_default: true,
    position: 1,
  },
  {
    name: 'Notifications',
    description: 'Slack, GitHub, Google, calendrier, outils SaaS',
    prompt: 'Automated notifications from SaaS tools and productivity apps: Slack messages, GitHub notifications, Google Workspace alerts, calendar invitations, CI/CD build results, Notion updates, Figma comments, Linear tickets, project management tools.',
    color: '#00838f',
    is_default: true,
    position: 2,
  },
  {
    name: 'Newsletter',
    description: 'Abonnements, veille, marketing souscrit',
    prompt: 'Newsletter and content subscriptions the user opted into: industry news digests, blog updates, marketing emails from services the user uses, weekly recaps, curated content.',
    color: '#e65100',
    is_default: true,
    position: 3,
  },
  {
    name: 'Prospection utile',
    description: 'Offres commerciales pertinentes pour votre métier',
    prompt: 'Commercial outreach that could be relevant to the user\'s role and industry. The sender offers a product or service that matches the user\'s business needs. Not mass-sent — shows signs of personalization or relevance.',
    color: '#f57f17',
    is_default: true,
    position: 4,
  },
  {
    name: 'Prospection',
    description: 'Cold outreach, pitches non sollicités',
    prompt: 'Generic cold outreach and sales pitches. Unsolicited commercial contact from strangers with no specific relevance to the user\'s role. Partnership requests, demo invitations, \'quick question\' openers.',
    color: '#c62828',
    is_default: true,
    position: 5,
  },
  {
    name: 'Spam',
    description: 'Mass mailing, outils prospection, phishing',
    prompt: 'Mass-sent prospecting via tools (Lemlist, Apollo, Instantly), phishing attempts, scam emails, automated sequences, emails with tracking pixels from unknown senders, obvious bulk campaigns.',
    color: '#6a1b9a',
    is_default: true,
    position: 6,
  },
]

/**
 * Map a legacy ClassificationResult to the default label name.
 * Used by fingerprinting/prefilter which still return ClassificationResult internally.
 */
export const LEGACY_RESULT_TO_DEFAULT_LABEL: Record<string, string[]> = {
  'A_VOIR': ['Important'],
  'FILTRE': ['Newsletter', 'Notifications', 'Prospection utile'],
  'BLOQUE': ['Prospection', 'Spam'],
}
```

- [ ] **Step 2: Export from shared index**

Add to `packages/shared/src/index.ts` after the existing type exports:

```typescript
// User Labels
export type { UserLabel } from './types/user-label'
export { DEFAULT_LABELS, LEGACY_RESULT_TO_DEFAULT_LABEL } from './types/user-label'
```

- [ ] **Step 3: Build to verify**

```bash
npx turbo run build --filter=@kyrra/shared --filter=@kyrra/worker
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/types/user-label.ts packages/shared/src/index.ts
git commit -m "feat: add UserLabel type and DEFAULT_LABELS with AI prompts"
```

---

## Task 3: Prompt Builder — Dynamic LLM System Prompt

**Files:**
- Create: `apps/worker/src/lib/prompt-builder.ts`

- [ ] **Step 1: Write the prompt builder**

Create `apps/worker/src/lib/prompt-builder.ts`:

```typescript
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
```

- [ ] **Step 2: Build to verify**

```bash
npx turbo run build --filter=@kyrra/worker
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add apps/worker/src/lib/prompt-builder.ts
git commit -m "feat: dynamic LLM prompt builder from user labels"
```

---

## Task 4: Label Resolver — Map Legacy Results to User Labels

**Files:**
- Create: `apps/worker/src/lib/label-resolver.ts`

- [ ] **Step 1: Write the label resolver**

Create `apps/worker/src/lib/label-resolver.ts`:

```typescript
import type { UserLabel } from '@kyrra/shared'
import { LEGACY_RESULT_TO_DEFAULT_LABEL } from '@kyrra/shared'
import type { ClassificationResult } from '@kyrra/shared'

/**
 * Resolve a legacy ClassificationResult (from fingerprint/prefilter) to a user label.
 * The fingerprint engine returns BLOQUE/FILTRE/A_VOIR — this maps to the user's
 * actual label (which may have been renamed or customized).
 *
 * Strategy: find the user's default label that matches the legacy result.
 * If user deleted the default, fall back to the first label (safest = most visible).
 */
export function resolveLabel(
  legacyResult: ClassificationResult,
  userLabels: UserLabel[],
): UserLabel {
  const candidateNames = LEGACY_RESULT_TO_DEFAULT_LABEL[legacyResult] ?? ['Important']

  // Try to find a matching default label by name
  for (const name of candidateNames) {
    const match = userLabels.find((l) => l.is_default && l.name === name)
    if (match) return match
  }

  // Fallback: find any default label that semantically matches
  // BLOQUE → last position labels (most aggressive)
  // A_VOIR → first position labels (most visible)
  // FILTRE → middle position labels
  if (legacyResult === 'BLOQUE') {
    const sorted = [...userLabels].sort((a, b) => b.position - a.position)
    return sorted[0]!
  }
  if (legacyResult === 'A_VOIR') {
    const sorted = [...userLabels].sort((a, b) => a.position - b.position)
    return sorted[0]!
  }
  // FILTRE → middle
  const sorted = [...userLabels].sort((a, b) => a.position - b.position)
  return sorted[Math.floor(sorted.length / 2)]!
}

/**
 * Resolve an LLM-returned label name to a user label.
 * Falls back to the first label (most visible) if name doesn't match.
 */
export function resolveLabelByName(
  labelName: string,
  userLabels: UserLabel[],
): UserLabel {
  const match = userLabels.find((l) => l.name === labelName)
  if (match) return match

  // Case-insensitive fallback
  const ciMatch = userLabels.find((l) => l.name.toLowerCase() === labelName.toLowerCase())
  if (ciMatch) return ciMatch

  // Last resort: first label (safest — surfaces the email)
  return userLabels.sort((a, b) => a.position - b.position)[0]!
}
```

- [ ] **Step 2: Build to verify**

```bash
npx turbo run build --filter=@kyrra/worker
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add apps/worker/src/lib/label-resolver.ts
git commit -m "feat: label resolver — maps legacy results and LLM names to user labels"
```

---

## Task 5: LLM Gateway — Accept Dynamic Labels

**Files:**
- Modify: `apps/worker/src/lib/llm-gateway.ts`

- [ ] **Step 1: Update LLMClassificationResult to return label name**

In `apps/worker/src/lib/llm-gateway.ts`, replace the `LLMClassificationResult` interface:

```typescript
// OLD
export interface LLMClassificationResult {
  result: ClassificationResult
  confidence: number
  summary: string
  _usage?: { inputTokens: number; outputTokens: number; costUsd: number; model: string; latencyMs: number }
}

// NEW
export interface LLMClassificationResult {
  result: ClassificationResult
  labelName: string              // NEW: exact label name from user's labels
  confidence: number
  summary: string
  _usage?: { inputTokens: number; outputTokens: number; costUsd: number; model: string; latencyMs: number }
}
```

- [ ] **Step 2: Add systemPromptOverride parameter to classifyWithLLM**

Update the `classifyWithLLM` function signature and body. Replace the entire function:

```typescript
export async function classifyWithLLM(
  email: EmailContent,
  supabase: any,
  systemPromptOverride?: string,
): Promise<LLMClassificationResult | null> {
  // Check circuit breaker
  if (await isCircuitOpen(supabase)) {
    console.log('LLM circuit breaker open — routing to rules fallback')
    return null
  }

  // Use dynamic prompt if provided, otherwise fall back to legacy hardcoded prompt
  const systemPrompt = systemPromptOverride ?? buildLegacyPrompt(email)

  const userMessage = `From: ${email.from}
Subject: ${email.subject}

--- Email content (truncated for privacy) ---
${email.headers}
[...]
${email.tail}
--- End ---`

  try {
    const llmStartTime = Date.now()
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS)

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 200,
        temperature: 0.1,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!response.ok) {
      console.error('LLM API error:', response.status)
      return null
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    const usage = data.usage

    if (!content) return null

    const parsed = JSON.parse(content)

    // Handle both dynamic (label) and legacy (category) response formats
    const labelName = parsed.label ?? parsed.category ?? ''
    const legacyResult = parsed.category as ClassificationResult | undefined

    // Validate: must have either label or category
    if (!labelName && !legacyResult) {
      console.error('LLM returned neither label nor category')
      return null
    }

    if (typeof parsed.confidence !== 'number' || parsed.confidence < 0 || parsed.confidence > 1) {
      console.error('LLM returned invalid confidence:', parsed.confidence)
      return null
    }

    // Map label name to legacy result for backwards compatibility
    // (classification.ts will use labelName for dynamic labels)
    const validCategories = ['A_VOIR', 'FILTRE', 'BLOQUE']
    const result: ClassificationResult = validCategories.includes(legacyResult ?? '')
      ? legacyResult as ClassificationResult
      : 'A_VOIR' // Default for dynamic label mode

    const inputTokens = usage?.prompt_tokens ?? 0
    const outputTokens = usage?.completion_tokens ?? 0
    const costUsd = (inputTokens * 0.15 + outputTokens * 0.60) / 1_000_000

    await recordMetrics(supabase, costUsd, true)

    return {
      result,
      labelName,
      confidence: parsed.confidence,
      summary: typeof parsed.summary === 'string' ? parsed.summary.slice(0, 200) : '',
      _usage: { inputTokens, outputTokens, costUsd, model: 'gpt-4o-mini', latencyMs: Date.now() - llmStartTime },
    }
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      console.error('LLM timeout (>14s) — routing to rules fallback')
    } else {
      console.error('LLM classification error:', error)
    }
    return null
  }
}
```

- [ ] **Step 3: Extract the legacy prompt into a helper**

Add this function above `classifyWithLLM` in the same file:

```typescript
function buildLegacyPrompt(email: EmailContent): string {
  return `You are Kyrra, an AI email classification system for B2B professionals.
Classify the incoming email as one of: A_VOIR (worth reviewing), FILTRE (filtered noise), BLOQUE (blocked spam/prospecting).

User context:
- Role: ${email.userRole} (business decision-maker)
- Exposure mode: ${email.exposureMode}

CRITICAL RULES — classify in this order:

1. TRANSACTIONAL/SERVICE emails are ALWAYS A_VOIR — NEVER classify as FILTRE or BLOQUE:
   - Authentication: OTP codes, verification emails, password resets, 2FA
   - Billing: invoices, payment confirmations, payment failures, subscription renewals
   - Security alerts: login notifications, suspicious activity, account warnings
   - Tool notifications: Slack, GitHub, Google Workspace, Notion, Figma, Linear, calendar invites
   - Account management: welcome emails, plan changes, usage alerts, quota warnings
   - Delivery/order: shipping confirmations, tracking, receipts

2. A_VOIR — Emails the user should see:
   - All transactional/service emails (rule 1 above)
   - Potentially relevant business emails matching user's industry/role
   - Emails from individuals (not mass-sent)
   - Anything you're uncertain about — when in doubt, A_VOIR

3. FILTRE — Noise the user probably doesn't need:
   - Generic marketing newsletters the user didn't subscribe to
   - Mass-sent commercial content not matching user's role
   - Automated digest/recap emails from platforms
   - Generic event invitations to unknown events

4. BLOQUE — Obvious unwanted outreach:
   - Cold prospecting/sales outreach from strangers
   - Mass-sent pitches using prospecting tools
   - Spam, phishing attempts, scam emails

KEY PRINCIPLE: When in doubt between FILTRE and A_VOIR, choose A_VOIR. A false negative (missing a real email) is far worse than a false positive (showing noise).

Respond with ONLY a JSON object:
{
  "category": "A_VOIR" | "FILTRE" | "BLOQUE",
  "confidence": 0.0 to 1.0,
  "summary": "One-line functional summary in the email's language (FR or EN). No PII."
}`
}
```

- [ ] **Step 4: Build to verify**

```bash
npx turbo run build --filter=@kyrra/worker
```

Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add apps/worker/src/lib/llm-gateway.ts
git commit -m "feat: LLM gateway accepts dynamic prompt, returns label name"
```

---

## Task 6: Gmail Labels API — List and Sample

**Files:**
- Modify: `apps/worker/src/lib/gmail.ts`

- [ ] **Step 1: Add listUserGmailLabels function**

Add at the end of `apps/worker/src/lib/gmail.ts`, before the `deleteKyrraLabels` function:

```typescript
// ── User Gmail labels (onboarding label scan) ──

export interface GmailLabelInfo {
  id: string
  name: string
  type: 'user' | 'system'
  color?: { textColor: string; backgroundColor: string }
  messagesTotal: number
}

/**
 * List all user-created Gmail labels with message counts.
 * Skips system labels (INBOX, SENT, TRASH, etc.) and Kyrra labels.
 */
export async function listUserGmailLabels(
  accessToken: string,
): Promise<GmailLabelInfo[]> {
  const response = await gmailFetch(accessToken, '/labels')
  const data = await response.json()
  const allLabels: Array<{ id: string; name: string; type: string; color?: any; messagesTotal?: number }> = data.labels ?? []

  // Filter to user-created labels only, skip Kyrra labels
  const userLabels = allLabels.filter(
    (l) => l.type === 'user' && !l.name.startsWith('Kyrra/'),
  )

  // Fetch detailed info (message counts) for each user label
  const detailed: GmailLabelInfo[] = []
  for (const label of userLabels) {
    try {
      const detailResponse = await gmailFetch(accessToken, `/labels/${label.id}`)
      const detail = await detailResponse.json()
      detailed.push({
        id: label.id,
        name: label.name,
        type: 'user',
        color: detail.color,
        messagesTotal: detail.messagesTotal ?? 0,
      })
    } catch {
      // Skip labels we can't read
    }
  }

  return detailed.sort((a, b) => b.messagesTotal - a.messagesTotal)
}

/**
 * Sample 2-3 recent emails from a specific Gmail label.
 * Returns metadata only (From + Subject) for onboarding example cards.
 */
export async function sampleEmailsFromLabel(
  accessToken: string,
  labelId: string,
  count: number = 3,
): Promise<Array<{ from: string; subject: string }>> {
  const params = new URLSearchParams({
    labelIds: labelId,
    maxResults: String(count),
    fields: 'messages(id)',
  })

  const listResponse = await gmailFetch(accessToken, `/messages?${params}`)
  const listData = await listResponse.json()
  const messageIds: string[] = (listData.messages ?? []).map((m: { id: string }) => m.id)

  const samples: Array<{ from: string; subject: string }> = []
  for (const msgId of messageIds) {
    try {
      const meta = await fetchEmailMetadata(accessToken, msgId)
      samples.push({ from: meta.from, subject: meta.subject })
    } catch {
      // Skip unreadable emails
    }
  }

  return samples
}
```

- [ ] **Step 2: Add ensureDynamicLabels function**

Add after `sampleEmailsFromLabel`:

```typescript
/**
 * Ensure Gmail labels exist for a user's dynamic label set.
 * - Labels with gmail_label_id: already exist in Gmail, skip.
 * - Labels without gmail_label_id: create as Kyrra/<name> in Gmail.
 * Returns a map of user_label.id → Gmail label ID.
 */
export async function ensureDynamicLabels(
  accessToken: string,
  userLabels: Array<{ id: string; name: string; color: string; gmail_label_id: string | null }>,
): Promise<Record<string, string>> {
  const labelMap: Record<string, string> = {}

  // Gmail color palette (closest matches for our colors)
  const colorMap: Record<string, { textColor: string; backgroundColor: string }> = {
    '#2e7d32': { textColor: '#0b4f30', backgroundColor: '#b9e4d0' },
    '#1565c0': { textColor: '#04502e', backgroundColor: '#a0dab3' },
    '#00838f': { textColor: '#094228', backgroundColor: '#b3efd3' },
    '#e65100': { textColor: '#662e37', backgroundColor: '#fbc8d9' },
    '#f57f17': { textColor: '#684e07', backgroundColor: '#fdedc1' },
    '#c62828': { textColor: '#711a36', backgroundColor: '#f7a7c0' },
    '#6a1b9a': { textColor: '#41236d', backgroundColor: '#d3bfdb' },
  }

  for (const label of userLabels) {
    if (label.gmail_label_id) {
      // Already linked to a Gmail label
      labelMap[label.id] = label.gmail_label_id
      continue
    }

    // Create Kyrra/<name> label in Gmail
    const gmailName = `Kyrra/${label.name}`
    const color = colorMap[label.color] ?? { textColor: '#666666', backgroundColor: '#e8e8e8' }

    try {
      // Check if label already exists
      const existingResponse = await gmailFetch(accessToken, '/labels')
      const existingData = await existingResponse.json()
      const existing = (existingData.labels ?? []).find((l: any) => l.name === gmailName)

      if (existing) {
        labelMap[label.id] = existing.id
        continue
      }

      const createResponse = await gmailFetch(accessToken, '/labels', {
        method: 'POST',
        body: JSON.stringify({
          name: gmailName,
          labelListVisibility: 'labelShow',
          messageListVisibility: 'show',
          color,
        }),
      })
      const created = await createResponse.json()
      labelMap[label.id] = created.id
    } catch (error) {
      console.error(`Failed to create Gmail label ${gmailName}:`, (error as Error).message)
    }
  }

  return labelMap
}

/**
 * Apply a dynamic label to a Gmail message.
 * Removes all other Kyrra labels first.
 */
export async function applyDynamicLabel(
  accessToken: string,
  messageId: string,
  targetGmailLabelId: string,
  allGmailLabelIds: string[],
): Promise<void> {
  const labelsToRemove = allGmailLabelIds.filter((id) => id !== targetGmailLabelId)

  await gmailFetch(accessToken, `/messages/${messageId}/modify`, {
    method: 'POST',
    body: JSON.stringify({
      addLabelIds: [targetGmailLabelId],
      removeLabelIds: labelsToRemove,
    }),
  })
}
```

- [ ] **Step 3: Build to verify**

```bash
npx turbo run build --filter=@kyrra/worker
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add apps/worker/src/lib/gmail.ts
git commit -m "feat: Gmail API for dynamic labels — list, sample, ensure, apply"
```

---

## Task 7: Classification Pipeline — Use Dynamic Labels

**Files:**
- Modify: `apps/worker/src/classification.ts`

- [ ] **Step 1: Rewrite classification.ts with dynamic label support**

Replace the entire file `apps/worker/src/classification.ts` with the updated version. Key changes:
1. Load user labels from `user_labels` table
2. Use `buildSystemPrompt()` for LLM calls
3. Use `resolveLabel()` / `resolveLabelByName()` for result mapping
4. Save `label_id` alongside `classification_result`
5. Use `ensureDynamicLabels()` + `applyDynamicLabel()` for Gmail

```typescript
import { SYSTEM_WHITELISTED_SENDERS, applyClassificationSafetyRules } from '@kyrra/shared'
import type { ClassificationResult, UserLabel } from '@kyrra/shared'
import { claimNextJob, completeJob, failJob } from './lib/queue-consumer'
import { fingerprintEmail, type EmailHeaders } from './lib/fingerprinting'
import { prefilterEmail } from './lib/prefilter'
import { classifyWithLLM } from './lib/llm-gateway'
import { stripPIIFromSummary, sanitizeForLLM } from './lib/pii-stripper'
import { getValidAccessToken, fetchEmailMetadata, fetchEmailBody, ensureDynamicLabels, applyDynamicLabel, GmailAuthError } from './lib/gmail'
import { ClassificationLogger } from './lib/classification-logger'
import { checkWhitelist } from './lib/whitelist-check'
import { buildSystemPrompt } from './lib/prompt-builder'
import { resolveLabel, resolveLabelByName } from './lib/label-resolver'

export async function classificationLoop(supabase: any): Promise<void> {
  const job = await claimNextJob(supabase)

  if (!job) {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return
  }

  const startTime = Date.now()

  try {
    const { data: integration } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', job.user_id)
      .eq('provider', 'gmail')
      .eq('status', 'active')
      .single()

    if (!integration) {
      await failJob(supabase, job.id, 'NO_ACTIVE_INTEGRATION', job.retry_count)
      return
    }

    const accessToken = await getValidAccessToken(supabase, integration)
    if (!accessToken) {
      await failJob(supabase, job.id, 'TOKEN_REVOKED', job.retry_count)
      return
    }

    // Load user's dynamic labels
    const { data: userLabels } = await supabase
      .from('user_labels')
      .select('*')
      .eq('user_id', job.user_id)
      .order('position', { ascending: true })

    // If user has no labels configured, skip (onboarding not complete)
    if (!userLabels || userLabels.length === 0) {
      await completeJob(supabase, job.id)
      return
    }

    // Fetch metadata only
    const metadata = await fetchEmailMetadata(accessToken, job.gmail_message_id)
    const emailHeaders: EmailHeaders = {
      from: metadata.from,
      subject: metadata.subject,
      headers: metadata.headers,
    }

    // System whitelist
    const senderEmail = emailHeaders.from.toLowerCase()
    if (SYSTEM_WHITELISTED_SENDERS.some((addr: string) => senderEmail === addr)) {
      await completeJob(supabase, job.id)
      return
    }

    // User whitelist
    const whitelistMatch = await checkWhitelist(supabase, job.user_id, senderEmail)
    if (whitelistMatch === 'exact') {
      ClassificationLogger.log({
        event: 'classification_skipped',
        email_id: job.gmail_message_id,
        reason: 'whitelist_exact_match',
      })
      await completeJob(supabase, job.id)
      return
    }

    // Idempotency
    const { data: existingClassification } = await supabase
      .from('email_classifications')
      .select('id')
      .eq('user_id', job.user_id)
      .eq('gmail_message_id', job.gmail_message_id)
      .limit(1)
      .maybeSingle()

    if (existingClassification) {
      await completeJob(supabase, job.id)
      return
    }

    // Pre-filter
    const prefilterResult = prefilterEmail(senderEmail, whitelistMatch)

    if (prefilterResult) {
      const resolvedLabel = resolveLabel(prefilterResult.result, userLabels as UserLabel[])

      // Domain whitelist override
      let finalLabel = resolvedLabel
      if (whitelistMatch === 'domain' && ['Prospection', 'Spam'].includes(resolvedLabel.name)) {
        finalLabel = userLabels.sort((a: any, b: any) => a.position - b.position)[0]
      }

      const processingTimeMs = Date.now() - startTime

      await supabase.from('email_classifications').insert({
        user_id: job.user_id,
        gmail_message_id: job.gmail_message_id,
        classification_result: prefilterResult.result,
        label_id: finalLabel.id,
        confidence_score: prefilterResult.confidence,
        summary: prefilterResult.reason,
        source: 'prefilter',
        processing_time_ms: processingTimeMs,
        idempotency_key: job.gmail_message_id,
      })

      try {
        const gmailLabelMap = await ensureDynamicLabels(accessToken, userLabels)
        const targetGmailId = gmailLabelMap[finalLabel.id]
        if (targetGmailId) {
          await applyDynamicLabel(accessToken, job.gmail_message_id, targetGmailId, Object.values(gmailLabelMap))
        }
      } catch (labelError) {
        console.error('Label application failed (will reconcile):', (labelError as Error).message)
      }

      await supabase.from('user_pipeline_health')
        .update({ last_classified_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('user_id', job.user_id)

      await completeJob(supabase, job.id)
      ClassificationLogger.log({
        event: 'classification_complete',
        email_id: job.gmail_message_id,
        classification_result: prefilterResult.result,
        label_name: finalLabel.name,
        confidence_score: prefilterResult.confidence,
        processing_time_ms: processingTimeMs,
        source: 'prefilter',
      })
      return
    }

    // Load user settings
    const { data: userSettings } = await supabase
      .from('user_settings')
      .select('user_role, exposure_mode, role, daily_credit_limit')
      .eq('user_id', job.user_id)
      .maybeSingle()

    const accountRole: string = userSettings?.role ?? 'user'
    const dailyCreditLimit: number = userSettings?.daily_credit_limit ?? 0
    const userRole: string = userSettings?.user_role ?? 'CEO'
    const exposureMode: string = userSettings?.exposure_mode ?? 'normal'

    // Credit check
    if (accountRole !== 'admin') {
      if (dailyCreditLimit === 0) {
        ClassificationLogger.log({ event: 'classification_skipped', email_id: job.gmail_message_id, reason: 'no_credits' })
        await completeJob(supabase, job.id)
        return
      }

      const todayDate = new Date().toISOString().split('T')[0]
      const { data: usageRow } = await supabase
        .from('usage_counters')
        .select('count')
        .eq('user_id', job.user_id)
        .eq('date_bucket', todayDate)
        .maybeSingle()

      if ((usageRow?.count ?? 0) >= dailyCreditLimit) {
        ClassificationLogger.log({ event: 'classification_skipped', email_id: job.gmail_message_id, reason: 'daily_limit_reached' })
        await completeJob(supabase, job.id)
        return
      }

      await supabase.rpc('increment_usage_counter', { p_user_id: job.user_id, p_date: todayDate })
    }

    // Fingerprinting
    const fpResult = fingerprintEmail(emailHeaders)

    let resolvedLabel: UserLabel
    let confidence: number
    let summary = ''
    let source: 'fingerprint' | 'llm' | 'prefilter' = 'fingerprint'
    let legacyResult: ClassificationResult
    let llmUsage: { inputTokens: number; outputTokens: number; costUsd: number; model: string } | null = null

    // Build dynamic prompt for LLM calls
    const dynamicPrompt = buildSystemPrompt(userLabels as UserLabel[], userRole, exposureMode)

    if (fpResult) {
      const signal = applyClassificationSafetyRules(fpResult.result, fpResult.confidence, 'fingerprint')

      if (signal === 'FORCE_LLM_REVIEW') {
        const body = await fetchEmailBody(accessToken, job.gmail_message_id)
        const llmResult = await classifyWithLLM({
          from: emailHeaders.from, subject: emailHeaders.subject,
          headers: sanitizeForLLM(body.bodyPreview), tail: sanitizeForLLM(body.bodyTail),
          userRole, exposureMode,
        }, supabase, dynamicPrompt)

        if (llmResult) {
          resolvedLabel = resolveLabelByName(llmResult.labelName, userLabels as UserLabel[])
          const llmSignal = applyClassificationSafetyRules(llmResult.result, llmResult.confidence, 'llm')
          legacyResult = llmSignal as ClassificationResult
          confidence = llmResult.confidence
          summary = stripPIIFromSummary(llmResult.summary)
          source = 'llm'
          if (llmResult._usage) llmUsage = llmResult._usage
        } else {
          resolvedLabel = resolveLabel('FILTRE', userLabels as UserLabel[])
          legacyResult = 'FILTRE'
          confidence = fpResult.confidence * 0.8
          summary = fpResult.reason
        }
      } else {
        legacyResult = signal as ClassificationResult
        resolvedLabel = resolveLabel(legacyResult, userLabels as UserLabel[])
        confidence = fpResult.confidence
        summary = fpResult.reason
      }
    } else {
      const body = await fetchEmailBody(accessToken, job.gmail_message_id)
      const llmResult = await classifyWithLLM({
        from: emailHeaders.from, subject: emailHeaders.subject,
        headers: sanitizeForLLM(body.bodyPreview), tail: sanitizeForLLM(body.bodyTail),
        userRole, exposureMode,
      }, supabase, dynamicPrompt)

      if (llmResult) {
        resolvedLabel = resolveLabelByName(llmResult.labelName, userLabels as UserLabel[])
        const llmSignal = applyClassificationSafetyRules(llmResult.result, llmResult.confidence, 'llm')
        legacyResult = llmSignal as ClassificationResult
        confidence = llmResult.confidence
        summary = stripPIIFromSummary(llmResult.summary)
        source = 'llm'
        if (llmResult._usage) llmUsage = llmResult._usage
      } else {
        resolvedLabel = resolveLabel('A_VOIR', userLabels as UserLabel[])
        legacyResult = 'A_VOIR'
        confidence = 0.3
        summary = 'Unable to classify — manual review recommended'
        source = 'fingerprint'
      }
    }

    // Domain whitelist override
    if (whitelistMatch === 'domain' && ['Prospection', 'Spam'].includes(resolvedLabel.name)) {
      resolvedLabel = (userLabels as UserLabel[]).sort((a, b) => a.position - b.position)[0]!
      legacyResult = 'A_VOIR'
    }

    // Exposure mode thresholds
    const aVoirThreshold = exposureMode === 'strict' ? 0.8 : exposureMode === 'permissive' ? 0.4 : 0.6
    if (legacyResult !== 'A_VOIR' && confidence < aVoirThreshold) {
      resolvedLabel = (userLabels as UserLabel[]).sort((a, b) => a.position - b.position)[0]!
      legacyResult = 'A_VOIR'
    }

    const processingTimeMs = Date.now() - startTime

    await supabase.from('email_classifications').insert({
      user_id: job.user_id,
      gmail_message_id: job.gmail_message_id,
      classification_result: legacyResult,
      label_id: resolvedLabel.id,
      confidence_score: confidence,
      summary, source,
      processing_time_ms: processingTimeMs,
      idempotency_key: job.gmail_message_id,
    })

    if (source === 'llm') {
      const inputTokens = llmUsage?.inputTokens ?? 0
      const outputTokens = llmUsage?.outputTokens ?? 0
      const costUsd = llmUsage?.costUsd ?? 0.001
      await supabase.from('llm_usage_logs').insert({
        user_id: job.user_id, gmail_message_id: job.gmail_message_id,
        model: llmUsage?.model ?? 'gpt-4o-mini',
        input_tokens: inputTokens, output_tokens: outputTokens,
        cost_usd: costUsd, latency_ms: processingTimeMs,
        classification_result: legacyResult,
      })
      console.log(`[COST] LLM: ${inputTokens}+${outputTokens} tokens, $${costUsd.toFixed(6)} (${resolvedLabel.name})`)
    }

    try {
      const gmailLabelMap = await ensureDynamicLabels(accessToken, userLabels)
      const targetGmailId = gmailLabelMap[resolvedLabel.id]
      if (targetGmailId) {
        await applyDynamicLabel(accessToken, job.gmail_message_id, targetGmailId, Object.values(gmailLabelMap))
      }
    } catch (labelError) {
      console.error('Label application failed (will reconcile):', (labelError as Error).message)
    }

    await supabase.from('user_pipeline_health')
      .update({ last_classified_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('user_id', job.user_id)

    await completeJob(supabase, job.id)

    ClassificationLogger.log({
      event: 'classification_complete',
      email_id: job.gmail_message_id,
      classification_result: legacyResult,
      label_name: resolvedLabel.name,
      confidence_score: confidence,
      processing_time_ms: processingTimeMs,
      source,
    })
  } catch (error) {
    if (error instanceof GmailAuthError) {
      await supabase.from('user_integrations')
        .update({ status: 'revoked', updated_at: new Date().toISOString() })
        .eq('user_id', job.user_id).eq('provider', 'gmail')
      await failJob(supabase, job.id, 'TOKEN_REVOKED', job.retry_count)
      return
    }
    console.error('Classification error:', error)
    await failJob(supabase, job.id, (error as Error).message, job.retry_count)
  }
}
```

- [ ] **Step 2: Build to verify**

```bash
npx turbo run build --filter=@kyrra/worker
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add apps/worker/src/classification.ts
git commit -m "feat: classification pipeline uses dynamic user labels"
```

---

## Task 8: Onboarding — Split Whitelist Scan and Label Config

**Files:**
- Modify: `apps/worker/src/onboarding.ts`

- [ ] **Step 1: Split onboarding into two phases**

The onboarding scan currently does whitelist + inbox scan in one go. Split it:
- Phase 1 (worker): Whitelist scan + Gmail label scan → mark `labels_configured = false`
- Phase 2 (web): User configures labels on `/configure-labels` page → saves to `user_labels`
- Phase 3 (worker): After labels saved, inbox scan runs

In `apps/worker/src/onboarding.ts`, replace the initial inbox scan section (after "Create Gmail Watch" block) with a check for `labels_configured`:

Replace from `// Initial inbox scan: queue emails for classification` to the end of the try block (before the catch) with:

```typescript
    // Scan user's Gmail labels for onboarding label proposal
    try {
      const { listUserGmailLabels, sampleEmailsFromLabel } = await import('./lib/gmail')
      const gmailLabels = await listUserGmailLabels(accessToken)
      console.log(`Gmail label scan: found ${gmailLabels.length} user labels for ${scan.user_id}`)

      // Store scanned labels in onboarding_scans metadata for the web UI
      await supabase
        .from('onboarding_scans')
        .update({
          gmail_labels: gmailLabels.slice(0, 20), // Cap at 20 labels
          updated_at: new Date().toISOString(),
        })
        .eq('id', scan.id)
    } catch (labelScanError) {
      console.error('Gmail label scan failed (non-fatal):', (labelScanError as Error).message)
    }

    // Wait for user to configure labels before inbox scan
    // The inbox scan will be triggered by a separate loop after labels_configured = true
    console.log(`Onboarding whitelist phase complete for ${scan.user_id} — waiting for label config`)
```

- [ ] **Step 2: Add migration for gmail_labels column**

Add to the migration file `supabase/migrations/023_create_user_labels.sql`:

```sql
-- 7. Add gmail_labels JSONB column to onboarding_scans for label proposal data
ALTER TABLE onboarding_scans
  ADD COLUMN IF NOT EXISTS gmail_labels JSONB DEFAULT '[]'::jsonb;
```

- [ ] **Step 3: Add inbox scan trigger loop**

Add a new exported function at the bottom of `apps/worker/src/onboarding.ts`:

```typescript
/**
 * Inbox scan loop — runs after user has configured their labels.
 * Checks for completed onboarding scans where labels_configured = true
 * but no inbox emails have been queued yet.
 */
export async function inboxScanLoop(supabase: any): Promise<void> {
  const { data: readyScans } = await supabase
    .from('onboarding_scans')
    .select('*, user_labels:user_labels(count)')
    .eq('status', 'completed')
    .eq('labels_configured', true)
    .limit(1)

  // Also check if user has labels but inbox scan hasn't run
  if (!readyScans || readyScans.length === 0) {
    await new Promise((resolve) => setTimeout(resolve, 5000))
    return
  }

  const scan = readyScans[0]

  // Check if inbox scan already ran (queue items exist)
  const { count } = await supabase
    .from('email_queue_items')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', scan.user_id)

  if ((count ?? 0) > 0) {
    // Already scanned
    await new Promise((resolve) => setTimeout(resolve, 5000))
    return
  }

  // Run inbox scan
  try {
    const { data: integration } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', scan.user_id)
      .eq('provider', 'gmail')
      .eq('status', 'active')
      .single()

    if (!integration) return

    const accessToken = await getValidAccessToken(supabase, integration)
    if (!accessToken) return

    const { data: userSettings } = await supabase
      .from('user_settings')
      .select('role, daily_credit_limit')
      .eq('user_id', scan.user_id)
      .maybeSingle()

    const scanLimit = getScanLimit(
      userSettings?.role ?? 'user',
      userSettings?.daily_credit_limit ?? 0,
    )

    const inboxMessageIds = await listInboxMessageIds(accessToken, scanLimit)
    console.log(`Inbox scan: found ${inboxMessageIds.length} emails for user ${scan.user_id}`)

    if (inboxMessageIds.length > 0) {
      const BATCH_SIZE = 500
      let totalQueued = 0

      for (let i = 0; i < inboxMessageIds.length; i += BATCH_SIZE) {
        const batch = inboxMessageIds.slice(i, i + BATCH_SIZE)

        const [{ data: existingQueue }, { data: existingClassifications }] = await Promise.all([
          supabase.from('email_queue_items').select('gmail_message_id').eq('user_id', scan.user_id).in('gmail_message_id', batch),
          supabase.from('email_classifications').select('gmail_message_id').eq('user_id', scan.user_id).in('gmail_message_id', batch),
        ])

        const alreadyProcessed = new Set([
          ...(existingQueue ?? []).map((q: any) => q.gmail_message_id),
          ...(existingClassifications ?? []).map((c: any) => c.gmail_message_id),
        ])

        const newItems = batch
          .filter((id) => !alreadyProcessed.has(id))
          .map((gmailMessageId) => ({
            user_id: scan.user_id,
            gmail_message_id: gmailMessageId,
            gmail_history_id: 'initial_scan',
            status: 'pending' as const,
          }))

        if (newItems.length > 0) {
          await supabase.from('email_queue_items').insert(newItems)
          totalQueued += newItems.length
        }
      }

      console.log(`Inbox scan: queued ${totalQueued} emails for classification`)
    }
  } catch (error) {
    console.error(`Inbox scan failed for user ${scan.user_id}:`, (error as Error).message)
  }
}
```

- [ ] **Step 4: Register inboxScanLoop in worker index.ts**

Add to `apps/worker/src/index.ts`:

```typescript
import { inboxScanLoop } from './onboarding'
```

And add to the `Promise.all` array:

```typescript
resilientLoop('inboxScan', () => inboxScanLoop(supabase)),
```

- [ ] **Step 5: Build to verify**

```bash
npx turbo run build --filter=@kyrra/worker
```

Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add apps/worker/src/onboarding.ts apps/worker/src/index.ts supabase/migrations/023_create_user_labels.sql
git commit -m "feat: split onboarding — whitelist scan then label config then inbox scan"
```

---

## Task 9: Web — Label Configuration Server Action

**Files:**
- Create: `apps/web/app/(auth)/actions/configure-labels.ts`

- [ ] **Step 1: Create the server action**

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import type { UserLabel } from '@kyrra/shared'

interface LabelConfig {
  name: string
  description: string
  prompt: string
  color: string
  gmail_label_id: string | null
  gmail_label_name: string | null
  is_default: boolean
  position: number
}

export async function saveLabelsConfig(
  labels: LabelConfig[],
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Not authenticated' }

  if (labels.length < 2) return { success: false, error: 'Minimum 2 labels required' }
  if (labels.length > 15) return { success: false, error: 'Maximum 15 labels' }

  // Delete existing labels (fresh start)
  await supabase.from('user_labels').delete().eq('user_id', user.id)

  // Insert new labels
  const rows = labels.map((label, index) => ({
    user_id: user.id,
    name: label.name,
    description: label.description,
    prompt: label.prompt,
    color: label.color,
    gmail_label_id: label.gmail_label_id,
    gmail_label_name: label.gmail_label_name,
    is_default: label.is_default,
    position: index,
  }))

  const { error: insertError } = await supabase.from('user_labels').insert(rows)

  if (insertError) {
    console.error('Failed to save labels:', insertError)
    return { success: false, error: 'Failed to save label configuration' }
  }

  // Mark onboarding as labels_configured
  await supabase
    .from('onboarding_scans')
    .update({ labels_configured: true, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)

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
```

- [ ] **Step 2: Build to verify**

```bash
npx turbo run build --filter=@kyrra/web
```

Expected: Build succeeds (or pre-existing errors only).

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/\(auth\)/actions/configure-labels.ts
git commit -m "feat: server action — save label config + get Gmail labels data"
```

---

## Task 10: Web — Label Configuration Page (Onboarding Step)

**Files:**
- Create: `apps/web/app/(auth)/configure-labels/page.tsx`
- Create: `apps/web/app/(auth)/configure-labels/LabelCard.client.tsx`
- Create: `apps/web/app/(auth)/configure-labels/AddLabelModal.client.tsx`

- [ ] **Step 1: Create the LabelCard component**

Create `apps/web/app/(auth)/configure-labels/LabelCard.client.tsx`:

```typescript
'use client'

interface LabelCardProps {
  name: string
  description: string
  color: string
  examples: string[]
  isGmailLabel: boolean
  onRemove: () => void
  onEditDescription: (desc: string) => void
}

export function LabelCard({
  name, description, color, examples, isGmailLabel, onRemove, onEditDescription,
}: LabelCardProps) {
  return (
    <div style={{
      border: '1px solid #e0e0e0',
      padding: '16px',
      position: 'relative',
      background: 'white',
    }}>
      <button
        onClick={onRemove}
        style={{
          position: 'absolute', top: '8px', right: '8px',
          background: 'none', border: 'none', color: '#ccc',
          cursor: 'pointer', fontSize: '14px',
        }}
      >
        ✕
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{
          width: '10px', height: '10px', borderRadius: '50%',
          backgroundColor: color, display: 'inline-block',
        }} />
        <span style={{ fontWeight: 600, fontSize: '14px' }}>{name}</span>
        {isGmailLabel && (
          <span style={{ fontSize: '10px', color: '#888', background: '#f0f0f0', padding: '1px 6px' }}>Gmail</span>
        )}
      </div>

      <input
        type="text"
        value={description}
        onChange={(e) => onEditDescription(e.target.value)}
        placeholder="Décrivez ce que ce label contient..."
        style={{
          width: '100%', border: '1px solid #eee', padding: '6px 8px',
          fontSize: '12px', color: '#555', marginBottom: '8px', outline: 'none',
        }}
      />

      {examples.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {examples.map((ex, i) => (
            <div key={i} style={{ background: '#f8f8f8', padding: '4px 8px', fontSize: '11px', color: '#666' }}>
              {ex}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create the AddLabelModal component**

Create `apps/web/app/(auth)/configure-labels/AddLabelModal.client.tsx`:

```typescript
'use client'

import { useState } from 'react'

interface AddLabelModalProps {
  onAdd: (name: string, description: string, color: string) => void
  onClose: () => void
}

const COLORS = ['#2e7d32', '#1565c0', '#00838f', '#e65100', '#f57f17', '#c62828', '#6a1b9a', '#455a64', '#37474f']

export function AddLabelModal({ onAdd, onClose }: AddLabelModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#455a64')

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
    }}>
      <div style={{ background: 'white', padding: '24px', width: '400px', maxWidth: '90vw' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>Ajouter un label</h3>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Nom</label>
          <input
            value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Fournisseurs"
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', fontSize: '13px' }}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Description</label>
          <textarea
            value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Décrivez les emails qui iront dans ce label..."
            rows={3}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', fontSize: '13px', resize: 'vertical' }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Couleur</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            {COLORS.map((c) => (
              <button
                key={c} onClick={() => setColor(c)}
                style={{
                  width: '24px', height: '24px', borderRadius: '50%', backgroundColor: c,
                  border: color === c ? '2px solid #000' : '2px solid transparent',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', background: '#f0f0f0', border: 'none', cursor: 'pointer' }}>
            Annuler
          </button>
          <button
            onClick={() => { if (name.trim()) onAdd(name.trim(), description.trim(), color) }}
            disabled={!name.trim()}
            style={{
              padding: '8px 16px', background: name.trim() ? '#0c1a32' : '#ccc',
              color: 'white', border: 'none', cursor: name.trim() ? 'pointer' : 'default',
            }}
          >
            Ajouter
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create the configure-labels page**

Create `apps/web/app/(auth)/configure-labels/page.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DEFAULT_LABELS } from '@kyrra/shared'
import { LabelCard } from './LabelCard.client'
import { AddLabelModal } from './AddLabelModal.client'
import { saveLabelsConfig, getOnboardingLabelsData } from '../actions/configure-labels'

interface LabelState {
  name: string
  description: string
  prompt: string
  color: string
  gmail_label_id: string | null
  gmail_label_name: string | null
  is_default: boolean
}

export default function ConfigureLabelsPage() {
  const router = useRouter()
  const [labels, setLabels] = useState<LabelState[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      const { gmailLabels } = await getOnboardingLabelsData()

      // Build merged label list: Gmail labels mapped to defaults + remaining defaults
      const merged: LabelState[] = []
      const usedDefaults = new Set<string>()

      // Map Gmail labels to Kyrra defaults by name similarity
      for (const gl of gmailLabels) {
        const glName = gl.name.toLowerCase()
        const matchedDefault = DEFAULT_LABELS.find((d) => {
          const dName = d.name.toLowerCase()
          return glName.includes(dName) || dName.includes(glName)
            || (glName.includes('client') && dName === 'important')
            || (glName.includes('factur') && dName === 'transactionnel')
            || (glName.includes('compta') && dName === 'transactionnel')
            || (glName.includes('admin') && dName === 'transactionnel')
            || (glName.includes('veille') && dName === 'newsletter')
            || (glName.includes('news') && dName === 'newsletter')
            || (glName.includes('spam') && dName === 'spam')
            || (glName.includes('pub') && dName === 'prospection')
        })

        if (matchedDefault && !usedDefaults.has(matchedDefault.name)) {
          usedDefaults.add(matchedDefault.name)
          merged.push({
            name: gl.name, // Keep Gmail label name
            description: matchedDefault.description,
            prompt: matchedDefault.prompt,
            color: gl.color?.backgroundColor ? matchedDefault.color : matchedDefault.color,
            gmail_label_id: gl.id,
            gmail_label_name: gl.name,
            is_default: true,
          })
        } else {
          // Gmail label with no Kyrra match — add as custom
          merged.push({
            name: gl.name,
            description: '',
            prompt: '', // User needs to describe it
            color: '#455a64',
            gmail_label_id: gl.id,
            gmail_label_name: gl.name,
            is_default: false,
          })
        }
      }

      // Add remaining Kyrra defaults that weren't matched
      for (const d of DEFAULT_LABELS) {
        if (!usedDefaults.has(d.name)) {
          merged.push({
            name: d.name,
            description: d.description,
            prompt: d.prompt,
            color: d.color,
            gmail_label_id: null,
            gmail_label_name: null,
            is_default: d.is_default,
          })
        }
      }

      setLabels(merged)
      setLoading(false)
    }

    init()
  }, [])

  const removeLabel = (index: number) => {
    if (labels.length <= 2) return
    setLabels((prev) => prev.filter((_, i) => i !== index))
  }

  const updateDescription = (index: number, desc: string) => {
    setLabels((prev) => prev.map((l, i) => i === index ? { ...l, description: desc, prompt: desc || l.prompt } : l))
  }

  const addLabel = (name: string, description: string, color: string) => {
    setLabels((prev) => [...prev, {
      name, description, prompt: description, color,
      gmail_label_id: null, gmail_label_name: null, is_default: false,
    }])
    setShowAddModal(false)
  }

  const handleSave = async () => {
    setSaving(true)
    const result = await saveLabelsConfig(
      labels.map((l, i) => ({ ...l, position: i })),
    )

    if (result.success) {
      router.push('/dashboard')
    } else {
      setSaving(false)
      alert(result.error)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0c1a32', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'white', fontSize: '16px' }}>Analyse de votre boîte mail...</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f8f8', padding: '40px 20px' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px' }}>
            Voici comment Kyrra va trier vos emails
          </h1>
          <p style={{ color: '#888', fontSize: '14px', margin: 0 }}>
            Basé sur l'analyse de votre boîte · Personnalisez si besoin
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px', marginBottom: '16px' }}>
          {labels.map((label, index) => (
            <LabelCard
              key={`${label.name}-${index}`}
              name={label.name}
              description={label.description}
              color={label.color}
              examples={[]}
              isGmailLabel={!!label.gmail_label_id}
              onRemove={() => removeLabel(index)}
              onEditDescription={(desc) => updateDescription(index, desc)}
            />
          ))}

          <button
            onClick={() => setShowAddModal(true)}
            style={{
              border: '1px dashed #ccc', padding: '32px', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              color: '#888', fontSize: '14px', cursor: 'pointer', background: 'white',
            }}
          >
            + Ajouter un label
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button
            onClick={handleSave}
            disabled={saving || labels.length < 2}
            style={{
              padding: '12px 32px', fontSize: '15px', fontWeight: 600,
              background: saving ? '#ccc' : '#0c1a32', color: 'white',
              border: 'none', cursor: saving ? 'default' : 'pointer',
            }}
          >
            {saving ? 'Configuration...' : "C'est parti — protéger ma boîte"}
          </button>
        </div>
      </div>

      {showAddModal && (
        <AddLabelModal
          onAdd={addLabel}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 4: Build to verify**

```bash
npx turbo run build --filter=@kyrra/web
```

Expected: Build succeeds (or pre-existing errors only).

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/\(auth\)/configure-labels/
git commit -m "feat: onboarding label configuration page with cards UI"
```

---

## Task 11: Onboarding Progress — Redirect to Label Config

**Files:**
- Modify: `apps/web/app/(auth)/onboarding-progress/page.tsx`

- [ ] **Step 1: Update redirect on scan completion**

In the onboarding-progress page, find the completion state that redirects to `/dashboard` and change it to redirect to `/configure-labels` instead.

Find the completion CTA button (or redirect logic) and replace:

```typescript
// OLD: router.push('/dashboard')
// NEW:
router.push('/configure-labels')
```

Also update the button text from "Voir votre tableau de bord" to "Configurer vos labels".

- [ ] **Step 2: Build to verify**

```bash
npx turbo run build --filter=@kyrra/web
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/\(auth\)/onboarding-progress/page.tsx
git commit -m "feat: redirect to label config after whitelist scan"
```

---

## Task 12: Dashboard — Show Dynamic Labels

**Files:**
- Modify: `apps/web/app/(dashboard)/actions/labels.ts`
- Modify: `apps/web/app/(dashboard)/dashboard/page.tsx`

- [ ] **Step 1: Update labels server action to read from user_labels**

Replace the content of `apps/web/app/(dashboard)/actions/labels.ts`:

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@kyrra/shared'
import type { UserLabel } from '@kyrra/shared'

export async function getLabels(): Promise<ActionResult<UserLabel[]>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: { code: 'AUTH_ERROR', message: 'Not authenticated' } }

  const { data: labels, error } = await supabase
    .from('user_labels')
    .select('*')
    .eq('user_id', user.id)
    .order('position', { ascending: true })

  if (error) return { success: false, error: { code: 'DB_ERROR', message: error.message } }

  return { success: true, data: labels ?? [] }
}
```

- [ ] **Step 2: Update dashboard to use dynamic labels**

In `apps/web/app/(dashboard)/dashboard/page.tsx`, replace the hardcoded `A_VOIR`/`FILTRE`/`BLOQUE` references with dynamic labels loaded from the server action. The key change is:

- Load labels via `getLabels()` at the top of the component
- Replace the hardcoded classification breakdown with a dynamic loop over user labels
- Use `label_id` from `email_classifications` to group by label instead of `classification_result`

This is a UI-level change — update the query to JOIN with `user_labels` and group by `label_id, user_labels.name, user_labels.color`.

- [ ] **Step 3: Build and verify**

```bash
npx turbo run build --filter=@kyrra/web
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/\(dashboard\)/actions/labels.ts apps/web/app/\(dashboard\)/dashboard/page.tsx
git commit -m "feat: dashboard shows dynamic user labels"
```

---

## Task 13: Run Migration + Deploy + Test

**Files:** None (operational task)

- [ ] **Step 1: Run the migration on Supabase**

```bash
SUPABASE_ACCESS_TOKEN=sbp_ef8b2c091beb162759ed5bc99bc5a19d4eb5a690 npx supabase db query --linked -f supabase/migrations/023_create_user_labels.sql
```

- [ ] **Step 2: Build full project**

```bash
npx turbo run build
```

- [ ] **Step 3: Deploy worker**

```bash
railway up --service worker --detach
```

- [ ] **Step 4: Deploy web**

```bash
railway service link web && railway up --service web --detach
```

- [ ] **Step 5: Test the full flow**

1. Navigate to the app, log in
2. Delete existing onboarding scan (fresh start):
```bash
SUPABASE_ACCESS_TOKEN=sbp_ef8b2c091beb162759ed5bc99bc5a19d4eb5a690 npx supabase db query --linked "DELETE FROM email_classifications WHERE user_id = '6096c16a-1897-4399-83ee-3335f74e1fd7'; DELETE FROM email_queue_items WHERE user_id = '6096c16a-1897-4399-83ee-3335f74e1fd7'; DELETE FROM user_labels WHERE user_id = '6096c16a-1897-4399-83ee-3335f74e1fd7'; UPDATE onboarding_scans SET status = 'pending', labels_configured = false, gmail_labels = '[]', started_at = NULL, completed_at = NULL, updated_at = NOW() WHERE user_id = '6096c16a-1897-4399-83ee-3335f74e1fd7'"
```
3. Visit `/onboarding-progress` → should show scan progress
4. After scan completes → should redirect to `/configure-labels`
5. On configure-labels page → should see cards with Gmail labels + Kyrra defaults
6. Customize labels → click "C'est parti"
7. Should redirect to `/dashboard`
8. Wait for inbox scan to queue emails → verify classifications use `label_id`

- [ ] **Step 6: Verify classifications have label_id**

```bash
SUPABASE_ACCESS_TOKEN=sbp_ef8b2c091beb162759ed5bc99bc5a19d4eb5a690 npx supabase db query --linked "SELECT ec.classification_result, ul.name as label_name, count(*) FROM email_classifications ec LEFT JOIN user_labels ul ON ec.label_id = ul.id WHERE ec.user_id = '6096c16a-1897-4399-83ee-3335f74e1fd7' AND ec.label_id IS NOT NULL GROUP BY ec.classification_result, ul.name"
```

Expected: Classifications grouped by dynamic label names (Important, Transactionnel, Newsletter, etc.)

- [ ] **Step 7: Commit any fixes from testing**

```bash
git add -A && git commit -m "fix: post-test adjustments for dynamic labels"
```
