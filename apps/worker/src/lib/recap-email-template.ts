/**
 * Kyrra Recap Email Template
 * "The Recap IS the mobile app" (Principle 7)
 *
 * Constraints:
 * - HTML tables + inline CSS only (no Flexbox in Outlook)
 * - Arial font (Inter not guaranteed in email clients)
 * - <80KB total
 * - No JS, no CSS variables
 * - Dark mode via @media (prefers-color-scheme: dark)
 * - Gmail deep links ONLY (Principle 3)
 * - Everything above "À voir" visible without scroll on iPhone SE (320px)
 * - MSO conditionals for Outlook
 *
 * Source: [ux-design-specification.md — Recap structure, Journey 2]
 */

export interface RecapEmailData {
  userName: string
  date: string // formatted date e.g. "Lundi 21 mars"
  filteredCount: number
  timeSavedMinutes: number
  aVoirEmails: {
    summary: string
    gmailMessageId: string
    confidenceScore?: number
    reclassifyTokenUrl?: string // FR85 — in-email reclassification deep link
  }[]
  cumulativeStats: {
    totalFiltered: number
    totalTimeSavedHours: number
    estimatedValue: number // EUR
    daysSinceSignup: number
  }
  monthlyStats?: {
    monthLabel: string // e.g. "février 2026"
    totalFiltered: number
    totalAVoir: number
    timeSavedHours: number
  }
  referralUrl: string
  settingsUrl: string
  unsubscribeUrl: string
}

// Colors (hardcoded — no CSS vars in email)
const COLORS = {
  bg: '#fafaf9',
  bgDark: '#111110',
  text: '#1a1a18',
  textDark: '#f5f5f4',
  muted: '#9ca3af',
  mutedDark: '#a1a1aa',
  border: '#e5e5e3',
  borderDark: '#2a2a28',
  aVoir: '#2563eb',
  aVoirBg: '#dbeafe',
  protected: '#16a34a',
  protectedBg: '#dcfce7',
  card: '#ffffff',
  cardDark: '#1c1c1a',
} as const

export function generateRecapEmailHtml(data: RecapEmailData): string {
  const {
    userName,
    date,
    filteredCount,
    timeSavedMinutes,
    aVoirEmails,
    cumulativeStats,
    monthlyStats,
    referralUrl,
    settingsUrl,
    unsubscribeUrl,
  } = data

  const firstName = userName.split(' ')[0] || userName
  const timeSavedDisplay = timeSavedMinutes >= 60
    ? `~${Math.round(timeSavedMinutes / 60)}h${timeSavedMinutes % 60 > 0 ? String(timeSavedMinutes % 60).padStart(2, '0') : ''}`
    : `~${timeSavedMinutes} min`
  const hasAlerts = aVoirEmails.length > 0

  const aVoirSection = hasAlerts
    ? aVoirEmails.map((email) => {
        const gmailLink = `https://mail.google.com/mail/u/0/#inbox/${email.gmailMessageId}`
        const confidenceDisplay = email.confidenceScore !== undefined && email.confidenceScore < 0.75
          ? `<span style="font-size:11px;color:${COLORS.muted};">${Math.round(email.confidenceScore * 100)}%</span>`
          : ''
        const reclassifyButton = email.reclassifyTokenUrl
          ? `<a href="${escapeHtml(email.reclassifyTokenUrl)}" target="_blank" rel="noopener noreferrer" style="font-size:11px;color:${COLORS.muted};text-decoration:underline;white-space:nowrap;">Reclassifier</a>`
          : ''
        return `
                        <tr>
                          <td style="padding:12px 0;border-bottom:1px solid ${COLORS.border};">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                              <tr>
                                <td width="60" style="vertical-align:top;padding-right:10px;">
                                  <span style="display:inline-block;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;padding:3px 8px;border-radius:100px;background:${COLORS.aVoirBg};color:${COLORS.aVoir};">&#192; voir</span>
                                </td>
                                <td style="vertical-align:top;">
                                  <a href="${escapeHtml(gmailLink)}" target="_blank" rel="noopener noreferrer" style="font-size:13px;color:${COLORS.text};text-decoration:none;line-height:1.4;">${escapeHtml(email.summary)}</a>
                                  ${confidenceDisplay ? `<br>${confidenceDisplay}` : ''}
                                </td>
                                <td width="80" style="vertical-align:top;text-align:right;">
                                  <a href="${escapeHtml(gmailLink)}" target="_blank" rel="noopener noreferrer" style="font-size:12px;color:${COLORS.aVoir};text-decoration:none;white-space:nowrap;">Voir&nbsp;&rarr;</a>
                                  ${reclassifyButton ? `<br>${reclassifyButton}` : ''}
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>`
      }).join('')
    : ''

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Kyrra Recap — ${escapeHtml(date)}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    /* Reset */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; }
    body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; }

    /* Dark mode */
    @media (prefers-color-scheme: dark) {
      .email-bg { background-color: ${COLORS.bgDark} !important; }
      .email-card { background-color: ${COLORS.cardDark} !important; }
      .email-text { color: ${COLORS.textDark} !important; }
      .email-muted { color: ${COLORS.mutedDark} !important; }
      .email-border { border-color: ${COLORS.borderDark} !important; }
      .email-hero { color: ${COLORS.textDark} !important; }
      .email-avoir-link { color: ${COLORS.textDark} !important; }
    }

    /* Mobile */
    @media only screen and (max-width: 480px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .email-hero-number { font-size: 48px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${COLORS.bg};font-family:Arial,Helvetica,sans-serif;" class="email-bg">
  <!-- Preheader text (hidden, shows in inbox preview) -->
  <div style="display:none;font-size:1px;color:${COLORS.bg};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    ${filteredCount} distractions supprim&#233;es${hasAlerts ? ` · ${aVoirEmails.length} &#224; voir` : ''} · ${timeSavedDisplay} gagn&#233;es
  </div>

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLORS.bg};" class="email-bg">
    <tr>
      <td align="center" style="padding:0;">
        <!-- Container (max 560px — calm, narrow) -->
        <table role="presentation" class="email-container" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">

          <!-- HEADER: Logo + date (24px height, minimal) -->
          <tr>
            <td style="padding:24px 24px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-size:14px;font-weight:600;color:${COLORS.text};letter-spacing:-0.01em;" class="email-text">
                    Kyrra
                  </td>
                  <td align="right" style="font-size:12px;color:${COLORS.muted};" class="email-muted">
                    ${escapeHtml(date)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- SECTION 1: Reassurance FIRST -->
          <tr>
            <td style="padding:32px 24px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="8" style="vertical-align:middle;">
                    <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background-color:${COLORS.protected};"></span>
                  </td>
                  <td style="padding-left:8px;font-size:13px;color:${COLORS.protected};" class="email-text">
                    ${hasAlerts
                      ? `${aVoirEmails.length} email${aVoirEmails.length > 1 ? 's' : ''} m&#233;rite${aVoirEmails.length > 1 ? 'nt' : ''} votre attention`
                      : 'Votre bo&#238;te est prot&#233;g&#233;e'}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- SECTION 2: Hero stat + time saved -->
          <tr>
            <td style="padding:24px 24px 0;">
              <span style="font-size:56px;font-weight:300;line-height:1;letter-spacing:-0.04em;color:${COLORS.text};" class="email-hero email-hero-number email-text">${filteredCount}</span>
              <br>
              <span style="font-size:14px;color:${COLORS.muted};letter-spacing:0.01em;" class="email-muted">distractions supprim&#233;es</span>
              <span style="font-size:14px;color:${COLORS.muted};padding:0 4px;" class="email-muted">&middot;</span>
              <span style="font-size:14px;color:${COLORS.muted};letter-spacing:0.01em;" class="email-muted">${timeSavedDisplay} gagn&#233;es</span>
            </td>
          </tr>

          ${hasAlerts ? `
          <!-- SECTION 3: À voir emails -->
          <tr>
            <td style="padding:28px 24px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:${COLORS.muted};padding-bottom:8px;" class="email-muted">
                    &#192; voir (${aVoirEmails.length})
                  </td>
                </tr>
                ${aVoirSection}
              </table>
            </td>
          </tr>
          ` : ''}

          ${monthlyStats ? `
          <!-- SECTION 4: Monthly stats (FR52 — 1st of month only) -->
          <tr>
            <td style="padding:32px 24px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${COLORS.border};background:${COLORS.protectedBg};border-radius:8px;" class="email-border">
                <tr>
                  <td style="padding:16px;">
                    <span style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:${COLORS.protected};">
                      Bilan ${escapeHtml(monthlyStats.monthLabel)}
                    </span>
                    <br>
                    <span style="font-size:13px;color:${COLORS.text};line-height:1.6;" class="email-text">
                      ${monthlyStats.totalFiltered} filtr&#233;s &middot; ${monthlyStats.totalAVoir} &#224; voir &middot; ~${monthlyStats.timeSavedHours}h gagn&#233;es
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- SECTION 5: Cumulative stats -->
          <tr>
            <td style="padding:32px 24px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${COLORS.border};" class="email-border">
                <tr>
                  <td style="padding-top:16px;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:${COLORS.muted};" class="email-muted">
                    Depuis votre inscription (${cumulativeStats.daysSinceSignup}j)
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:8px;font-size:13px;color:${COLORS.text};" class="email-text">
                    ${cumulativeStats.totalFiltered} filtr&#233;s &middot; ~${cumulativeStats.totalTimeSavedHours}h gagn&#233;es &middot; valeur ${cumulativeStats.estimatedValue}&#8364;
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- REFERRAL CTA (discreet, complicit) -->
          <tr>
            <td style="padding:32px 24px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${COLORS.border};" class="email-border">
                <tr>
                  <td style="padding-top:16px;font-size:12px;color:${COLORS.muted};text-align:center;" class="email-muted">
                    Un coll&#232;gue noy&#233; sous la prospection&nbsp;?
                    <a href="${escapeHtml(referralUrl)}" target="_blank" rel="noopener noreferrer" style="color:${COLORS.aVoir};text-decoration:none;">Partager Kyrra</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding:24px 24px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="font-size:11px;color:${COLORS.muted};line-height:1.6;" class="email-muted">
                    <a href="${escapeHtml(settingsUrl)}" target="_blank" rel="noopener noreferrer" style="color:${COLORS.muted};text-decoration:underline;">Fr&#233;quence</a>
                    &nbsp;&middot;&nbsp;
                    <a href="${escapeHtml(unsubscribeUrl)}" target="_blank" rel="noopener noreferrer" style="color:${COLORS.muted};text-decoration:underline;">Se d&#233;sabonner</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/**
 * Generate the subject line for the Recap email
 * Distinctive with numbers to stand out in inbox (W5 friction fix)
 */
export function generateRecapSubject(filteredCount: number, aVoirCount: number): string {
  if (aVoirCount > 0) {
    return `${filteredCount} filtrés, ${aVoirCount} à voir — Kyrra Recap`
  }
  return `${filteredCount} distractions supprimées — Kyrra Recap`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
