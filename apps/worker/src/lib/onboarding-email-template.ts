/**
 * Kyrra Onboarding Email Template — "Kyrra est actif"
 * Sent 1h after scan completion (B4.2)
 *
 * Same constraints as recap-email-template.ts:
 * - HTML tables + inline CSS only (no Flexbox in Outlook)
 * - Arial font, <80KB, no JS, no CSS variables
 * - Dark mode via @media (prefers-color-scheme: dark)
 */

export interface OnboardingEmailData {
  userName: string
  contactsFound: number
  emailsProcessed: number
}

// Colors (same palette as recap — brand consistency)
const COLORS = {
  bg: '#fafaf9',
  bgDark: '#111110',
  text: '#1a1a18',
  textDark: '#f5f5f4',
  muted: '#9ca3af',
  mutedDark: '#a1a1aa',
  border: '#e5e5e3',
  borderDark: '#2a2a28',
  protected: '#16a34a',
  protectedBg: '#dcfce7',
  card: '#ffffff',
  cardDark: '#1c1c1a',
} as const

export function generateOnboardingEmailHtml(data: OnboardingEmailData): string {
  const { userName, contactsFound, emailsProcessed } = data
  const firstName = userName.split(' ')[0] || userName

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Kyrra est actif</title>
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
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; }
    @media (prefers-color-scheme: dark) {
      .email-bg { background-color: ${COLORS.bgDark} !important; }
      .email-card { background-color: ${COLORS.cardDark} !important; }
      .email-text { color: ${COLORS.textDark} !important; }
      .email-muted { color: ${COLORS.mutedDark} !important; }
      .email-border { border-color: ${COLORS.borderDark} !important; }
    }
    @media only screen and (max-width: 480px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${COLORS.bg};font-family:Arial,Helvetica,sans-serif;" class="email-bg">
  <div style="display:none;font-size:1px;color:${COLORS.bg};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    Kyrra prot&#232;ge votre bo&#238;te mail d&#232;s maintenant
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLORS.bg};" class="email-bg">
    <tr>
      <td align="center" style="padding:0;">
        <table role="presentation" class="email-container" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">

          <!-- HEADER -->
          <tr>
            <td style="padding:24px 24px 0;">
              <span style="font-size:14px;font-weight:600;color:${COLORS.text};letter-spacing:-0.01em;" class="email-text">Kyrra</span>
            </td>
          </tr>

          <!-- STATUS -->
          <tr>
            <td style="padding:32px 24px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="8" style="vertical-align:middle;">
                    <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background-color:${COLORS.protected};"></span>
                  </td>
                  <td style="padding-left:8px;font-size:13px;color:${COLORS.protected};" class="email-text">
                    Kyrra est actif
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- GREETING -->
          <tr>
            <td style="padding:24px 24px 0;">
              <span style="font-size:18px;font-weight:300;color:${COLORS.text};line-height:1.4;" class="email-text">
                Bonjour ${escapeHtml(firstName)},
              </span>
              <br><br>
              <span style="font-size:14px;color:${COLORS.text};line-height:1.6;" class="email-text">
                Votre bo&#238;te mail est d&#233;sormais prot&#233;g&#233;e par Kyrra.
              </span>
            </td>
          </tr>

          <!-- SCAN RESULTS -->
          <tr>
            <td style="padding:24px 24px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.protectedBg};border-radius:8px;">
                <tr>
                  <td style="padding:16px;">
                    <span style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:${COLORS.protected};">
                      R&#233;sultats du scan
                    </span>
                    <br>
                    <span style="font-size:14px;color:${COLORS.text};line-height:1.8;" class="email-text">
                      ${emailsProcessed} emails analys&#233;s<br>
                      ${contactsFound} contacts de confiance identifi&#233;s
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- NEXT STEPS -->
          <tr>
            <td style="padding:24px 24px 0;">
              <span style="font-size:14px;color:${COLORS.text};line-height:1.6;" class="email-text">
                Kyrra filtre d&#233;sormais les emails entrants et classe automatiquement la prospection.
              </span>
              <br><br>
              <span style="font-size:14px;font-weight:600;color:${COLORS.text};" class="email-text">
                Votre premier Recap arrivera demain matin.
              </span>
              <br><br>
              <span style="font-size:13px;color:${COLORS.muted};line-height:1.6;" class="email-muted">
                Le Recap est un email quotidien qui r&#233;sume les emails filtr&#233;s et ceux qui m&#233;ritent votre attention.
              </span>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding:32px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${COLORS.border};" class="email-border">
                <tr>
                  <td align="center" style="padding-top:16px;font-size:11px;color:${COLORS.muted};line-height:1.6;" class="email-muted">
                    Kyrra &mdash; Faites taire le bruit. Gardez l&#8217;essentiel.
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

export function generateOnboardingSubject(): string {
  return 'Kyrra est actif — votre boîte est protégée'
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
