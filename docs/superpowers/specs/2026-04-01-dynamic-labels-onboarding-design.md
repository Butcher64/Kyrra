# Dynamic Labels & Onboarding Redesign — Design Spec

> Date: 2026-04-01
> Status: Approved
> Author: Thomas + Claude (brainstorm session)

## Problem

Kyrra's current 3-label system (A_VOIR / FILTRE / BLOQUE) is too binary. It treats email classification as "prospection or not" when real inboxes contain a spectrum: transactional (billing, auth, OTP), tool notifications (Slack, GitHub), newsletters the user wants, prospection that's actually relevant, and actual spam. This led to critical bugs: Google Workspace payment failures classified as BLOQUE, client emails classified as FILTRE.

## Solution

Replace the fixed 3-label system with dynamic, user-configurable labels. Each label carries an AI prompt that the classification pipeline uses. The onboarding wizard scans the client's existing Gmail labels and proposes an intelligent fusion with Kyrra's 7 defaults.

---

## 1. Default Label Taxonomy (7 labels)

| Label | Color | Default Prompt | Description |
|-------|-------|----------------|-------------|
| **Important** | 🟢 `#2e7d32` | Known contacts, direct replies, personal correspondence | Emails from people in the user's whitelist or direct conversation threads |
| **Transactionnel** | 🔵 `#1565c0` | Invoices, payment confirmations/failures, auth codes, OTP, 2FA, security alerts, account management | Automated service emails that are critical to not miss |
| **Notifications** | 🩵 `#00838f` | Tool notifications from Slack, GitHub, Google, Notion, Figma, Linear, calendar invites, CI/CD alerts | Automated notifications from SaaS tools the user actively uses |
| **Newsletter** | 🟠 `#e65100` | Subscribed newsletters, industry news, digests, marketing from services the user signed up for | Content the user opted into but doesn't need immediate attention |
| **Prospection utile** | 🟡 `#f57f17` | Commercial outreach that matches the user's industry, role, or current business needs | Cold emails that might actually be relevant — the "maybe" category |
| **Prospection** | 🔴 `#c62828` | Generic cold outreach, sales pitches, partnership requests from strangers | Unsolicited commercial contact with no relevance |
| **Spam** | 🟣 `#6a1b9a` | Mass mailing tools (Lemlist, Apollo), phishing attempts, scam emails, automated prospecting | Obvious junk that should never reach the inbox |

Users can remove any default label, add custom labels with a text description, and rename labels.

## 2. Onboarding Flow (6 Steps)

### Step 1 — Gmail Connection + Consent *(existing)*
OAuth flow with consent screen. No changes.

### Step 2 — Whitelist Scan *(existing)*
Scan 6 months of sent items, build SHA-256 whitelist. Progress bar UI. No changes.

### Step 3 — Scan Gmail Labels *(NEW)*
After whitelist scan completes:
1. Call Gmail API `users.labels.list` to get all user-created labels (skip system labels like INBOX, SENT, TRASH)
2. For each user label: count emails via `messages.list` with `labelIds` filter (metadata only, no content)
3. Sample 2-3 recent emails per label (metadata only — From header + Subject) for example cards
4. Store results in memory for step 4 (not persisted — GDPR)

### Step 4 — Label Proposal Cards *(NEW)*
Present the user with a card-based UI showing proposed labels:

**Fusion logic:**
- For each Gmail label the user has, attempt to map it to a Kyrra default:
  - Use the label name + sampled email patterns to determine the best match
  - If a Gmail label maps to a Kyrra default → use the Gmail label (keep its name), pre-fill the Kyrra prompt
  - If no match → show the Gmail label as-is, ask the user for a description
- For each Kyrra default that has NO Gmail equivalent → propose it as a new label to create
- Result: a merged list of labels (some from Gmail, some new from Kyrra)

**Card UI:**
- Each label is a card showing: color dot, label name, short description, 2-3 example emails (From/Subject from the user's actual inbox)
- Cards for Gmail labels show the Gmail color
- Cards for Kyrra-proposed labels show the Kyrra default color
- Each card has a ✕ button to remove the label
- A "+ Add label" card at the end

### Step 5 — Customization *(NEW)*
On the same screen as step 4, the user can:
- **Remove** a label by clicking ✕ (minimum 2 labels required)
- **Add** a custom label: modal with name, color picker, text description field ("Describe what emails should go in this label")
- **Edit** a label description by clicking on it
- **Reorder** labels (drag to reorder, affects priority)

No drag & drop of email examples in V1 — this will be added as an advanced feature in settings post-onboarding.

### Step 6 — Validation + Inbox Scan *(existing, adapted)*
- "C'est parti" button saves all labels to `user_labels` table
- Creates corresponding Gmail labels (prefixed `Kyrra/` only for NEW labels, not for reused Gmail labels)
- Triggers inbox scan with tier-based limit (existing)
- Classification pipeline now uses dynamic labels instead of fixed enum

## 3. Database Schema

### New table: `user_labels`

```sql
CREATE TABLE user_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                    -- Display name (e.g., "Clients", "Transactionnel")
  description TEXT NOT NULL DEFAULT '',  -- User-facing description
  prompt TEXT NOT NULL DEFAULT '',       -- AI prompt injected into LLM system prompt
  color TEXT NOT NULL DEFAULT '#888888', -- Hex color for UI display
  gmail_label_id TEXT,                   -- Gmail label ID (null if Kyrra-created)
  gmail_label_name TEXT,                 -- Gmail label name for display
  is_default BOOLEAN NOT NULL DEFAULT false, -- True for Kyrra's 7 defaults
  position INTEGER NOT NULL DEFAULT 0,  -- Sort order
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- RLS: users can only see/edit their own labels
ALTER TABLE user_labels ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_labels_own ON user_labels
  FOR ALL USING (auth.uid() = user_id);

-- Index for classification pipeline (loads all labels for a user)
CREATE INDEX idx_user_labels_user ON user_labels(user_id, position);
```

### Modified table: `email_classifications`

```sql
-- Add label_id column (nullable during migration)
ALTER TABLE email_classifications
  ADD COLUMN label_id UUID REFERENCES user_labels(id);

-- Keep classification_result for backwards compatibility during migration
-- New classifications will populate label_id instead
```

### Default label seed data

When a user completes onboarding, insert their chosen labels into `user_labels` with pre-built prompts for defaults. The prompt for each default label:

- **Important**: "Emails from known contacts, direct personal correspondence, replies in ongoing conversations. The sender is someone the user has previously communicated with."
- **Transactionnel**: "Transactional and service emails: invoices, payment confirmations, payment failures, authentication codes (OTP, 2FA), password resets, security alerts, account management notifications, subscription renewals, delivery tracking, receipts."
- **Notifications**: "Automated notifications from SaaS tools and productivity apps: Slack messages, GitHub notifications, Google Workspace alerts, calendar invitations, CI/CD build results, Notion updates, Figma comments, Linear tickets, project management tools."
- **Newsletter**: "Newsletter and content subscriptions the user opted into: industry news digests, blog updates, marketing emails from services the user uses, weekly recaps, curated content."
- **Prospection utile**: "Commercial outreach that could be relevant to the user's role and industry. The sender offers a product or service that matches the user's business needs. Not mass-sent — shows signs of personalization or relevance."
- **Prospection**: "Generic cold outreach and sales pitches. Unsolicited commercial contact from strangers with no specific relevance to the user's role. Partnership requests, demo invitations, 'quick question' openers."
- **Spam**: "Mass-sent prospecting via tools (Lemlist, Apollo, Instantly), phishing attempts, scam emails, automated sequences, emails with tracking pixels from unknown senders, obvious bulk campaigns."

## 4. Classification Pipeline Changes

### Dynamic prompt assembly

Replace the current hardcoded system prompt with dynamic assembly:

```typescript
function buildSystemPrompt(labels: UserLabel[], userRole: string, exposureMode: string): string {
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
- Transactional/service emails (auth, billing, security) must go to the label designated for transactional content
- Known contacts should go to the label for important/personal emails
- When in doubt, prefer the label that surfaces the email to the user rather than hiding it
- A false negative (missing a real email) is far worse than a false positive (showing noise)

Respond with ONLY a JSON object:
{
  "label": "<exact label name>",
  "confidence": 0.0 to 1.0,
  "summary": "One-line functional summary in the email's language (FR or EN). No PII."
}`
}
```

### LLM response handling

- The LLM now returns `label` (string name) instead of `category` (enum)
- Match the returned label name against the user's `user_labels` to get the `label_id`
- If the LLM returns an unknown label name → fall back to the label with the highest position (least aggressive)

### Fingerprinting and prefilter adaptation

The fingerprinting engine and prefilter currently return `ClassificationResult` (enum). They need to map to user labels:
- Fingerprint BLOQUE → map to user's "Spam" or "Prospection" label (find by `is_default` + known default name)
- Fingerprint FILTRE → map to user's "Newsletter" or "Prospection utile" label
- Prefilter results → same mapping logic
- Whitelist exact match → still skip classification (no label applied)
- Whitelist domain match → still allow classification but never map to "Spam" or "Prospection"

### Label application in Gmail

- For labels with `gmail_label_id` (reused from user's Gmail): apply that label directly
- For labels without `gmail_label_id` (Kyrra-created): create `Kyrra/<name>` label in Gmail, store the ID
- Remove old Kyrra labels when applying new ones (same as today)

## 5. Migration Strategy

### Beta — Fresh Start
- Existing beta users see the new onboarding on next login
- Old classifications remain in database (historical, `label_id = NULL`)
- Old Gmail labels (`Kyrra/À voir`, `Kyrra/Filtré`, `Kyrra/Bloqué`) are cleaned up
- New labels created per the onboarding flow
- Inbox re-scanned with new label system

### Post-beta — Automatic Migration
- Map existing `classification_result` to `label_id` based on defaults
- No user action required
- To be designed when the beta data validates the label taxonomy

## 6. Scope — What's NOT in V1

- **Drag & drop examples** — will be added in settings post-onboarding
- **AI reformulation of custom descriptions** — client writes, AI uses as-is
- **Label rules engine** — domain/sender rules that auto-assign labels (future)
- **Shared team labels** — Team plan feature (future)
- **Label analytics** — per-label stats in dashboard (future, quick win)

## 7. Success Criteria

1. No transactional email (billing, auth, OTP) is ever classified into Prospection or Spam
2. Known contacts (whitelist) are always classified as Important
3. Onboarding completes in under 3 minutes (scan + label config)
4. At least 80% of users keep 5+ labels active
5. Classification accuracy improves vs. the 3-label system (measured by reclassification rate)
