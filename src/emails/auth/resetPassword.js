import { renderEmail } from '../layout.js'

export function buildResetPasswordMail({ name, resetUrl, clientUrl }) {
  const subject = 'Instrucciones para restablecer tu contraseña'
  const html = renderEmail({
    title: 'Restablecer tu contraseña',
    subtitle: 'Solicitud de seguridad',
    greeting: `Hola ${name || ''},`,
    message: 'Has solicitado restablecer tu contraseña en Elite Advisors. Por seguridad, el enlace caduca en 60 minutos.',
    highlights: [
      'El enlace es válido por 60 minutos',
      'Si no solicitaste este cambio, ignora el mensaje',
      'No compartas este enlace con nadie'
    ],
    actionUrl: resetUrl,
    actionText: 'Restablecer contraseña',
    footer: 'Si no solicitaste este cambio, ignora este mensaje. No compartas este enlace.',
    supportUrl: `${clientUrl}/faq`,
    supportText: 'Centro de Ayuda'
  })
  const text = `Hola ${name || ''},\n\nHas solicitado restablecer tu contraseña en Elite Advisors.\nPor seguridad, el enlace caduca en 60 minutos.\n\nEnlace: ${resetUrl}\n\nSi no solicitaste este cambio, ignora este mensaje. No compartas este enlace.`
  return { subject, html, text }
}
