# Story B7.2: Auto-Whitelist on Reclassification

Status: done

## Story

As a **user**,
I want my reclassified senders to be automatically whitelisted,
so that future emails from them aren't misclassified.

## Acceptance Criteria

1. **Given** a user reclassifies an email **When** the action completes **Then** the sender is added to whitelist
2. **Given** the whitelist entry **When** future emails arrive from that sender **Then** they bypass classification

## Implementation

FR28 is handled client-side: `ReclassifyButton` calls `addToWhitelist()` in parallel with `reclassifyEmail()`. The sender email is available on the client from the email list display.

Server-side atomicity would require a Gmail API call to extract the sender email address (email_classifications only stores sender_display name). This is deferred to V2.

## Tasks

- [x] Task 1: Document FR28 pattern in reclassifyEmail action comment
