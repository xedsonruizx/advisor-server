export function renderEmail({ title, subtitle, greeting, message, highlights, actionUrl, actionText, footer, supportUrl, supportText }) {
  const brand = process.env.MAIL_BRAND_NAME || 'Elite Advisors'
  const colors = {
    primary: '#0f172a',
    secondary: '#c5a059',
    secondaryHover: '#b08d45',
    textDark: '#1e293b',
    textMuted: '#64748b',
    bgLight: '#f8fafc',
    white: '#ffffff'
  }
  const safeUrl = actionUrl || ''
  const safeActionText = actionText || 'Ver más'
  const safeFooter = footer || `© ${new Date().getFullYear()} ${brand}. Todos los derechos reservados.`
  const safeSubtitle = subtitle || ''
  const list = Array.isArray(highlights) ? highlights : []
  const helpUrl = supportUrl || ''
  const helpText = supportText || 'Centro de Ayuda'
  return `
  <!doctype html>
  <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${title}</title>
      <style>
        .preheader { display:none; max-height:0; overflow:hidden; opacity:0; color:transparent; visibility:hidden; mso-hide:all; }
        @media only screen and (max-width:620px) {
          .container { width:100% !important; }
          .content { padding:24px !important; }
          .btn { width:100% !important; }
        }
      </style>
    </head>
    <body style="margin:0; padding:0; background:${colors.bgLight}; color:${colors.textDark}; font-family: Arial, sans-serif;">
      <div class="preheader">${message || ''}</div>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:${colors.bgLight};">
        <tr>
          <td align="center" style="padding:24px 12px;">
            <table role="presentation" class="container" cellspacing="0" cellpadding="0" border="0" width="640" style="width:640px; max-width:640px; background:${colors.white}; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.05); overflow:hidden;">
              <tr>
                <td align="center" style="background:${colors.primary}; padding:24px;">
                  <div style="color:${colors.secondary}; font-size:20px; font-weight:bold; letter-spacing:0.5px; font-family: Georgia, serif;">${brand}</div>
                </td>
              </tr>
              <tr>
                <td class="content" style="padding:32px;">
                  <h1 style="font-size:22px; margin:0 0 12px; font-family: Georgia, serif; color:${colors.textDark};">${title}</h1>
                  ${safeSubtitle ? `<div style="font-size:13px; color:${colors.secondary}; text-transform:uppercase; letter-spacing:1px; margin-bottom:16px;">${safeSubtitle}</div>` : ''}
                  ${greeting ? `<p style="margin:0 0 12px; line-height:1.6; color:${colors.textDark};">${greeting}</p>` : ''}
                  ${message ? `<p style="margin:0 0 16px; line-height:1.6; color:${colors.textMuted};">${message}</p>` : ''}
                  ${list.length ? `
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:4px 0 16px;">
                      <tr>
                        <td>
                          <ul style="padding:0; margin:0;">
                            ${list.map(item => `
                              <li style="list-style:none; margin:0 0 8px; padding-left:24px; position:relative; color:${colors.textDark};">
                                <span style="position:absolute; left:0; top:0; color:${colors.secondary}; font-weight:bold;">✓</span>${item}
                              </li>
                            `).join('')}
                          </ul>
                        </td>
                      </tr>
                    </table>
                  ` : ''}
                  ${safeUrl ? `
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:12px 0 24px;">
                      <tr>
                        <td align="center">
                          <a href="${safeUrl}" target="_blank" rel="noopener noreferrer"
                             style="display:inline-block; background:${colors.secondary}; color:#ffffff; text-decoration:none; padding:12px 22px; border-radius:4px; text-transform:uppercase; letter-spacing:1px; font-weight:600; font-size:13px;">
                             ${safeActionText}
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:0; text-align:center; font-size:13px; color:${colors.textMuted};">
                      Si el botón no funciona, copia y pega este enlace en tu navegador:
                      <br/>
                      <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="color:${colors.secondary};">${safeUrl}</a>
                    </p>
                  ` : ''}
                  ${helpUrl ? `
                    <div style="height:1px; background:rgba(0,0,0,0.06); margin:24px 0;"></div>
                    <p style="margin:0; text-align:center; font-size:13px; color:${colors.textMuted};">
                      ¿Necesitas ayuda? Visita el <a href="${helpUrl}" target="_blank" rel="noopener noreferrer" style="color:${colors.secondary};">${helpText}</a>.
                    </p>
                  ` : ''}
                  <div style="height:1px; background:rgba(0,0,0,0.06); margin:24px 0;"></div>
                  <p style="margin:0; font-size:13px; color:${colors.textMuted};">Este mensaje fue enviado automáticamente, no respondas a este correo.</p>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding:16px 24px 24px;">
                  <div style="font-size:12px; color:${colors.textMuted};">${safeFooter}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `
}
