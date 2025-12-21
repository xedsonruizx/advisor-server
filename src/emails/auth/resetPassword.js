import { renderEmail } from '../layout.js'

export function buildResetPasswordMail({ name, resetUrl, clientUrl }) {
  const subject = 'Restablecer tu contraseña — Elite Advisors'
  const html = renderEmail({
    title: 'Restablecer tu contraseña',
    subtitle: 'Seguridad de cuenta',
    badge: 'Acción requerida',
    greeting: `Hola ${name || ''},`,
    message: `Has solicitado restablecer tu contraseña en Elite Advisors.<br/><span style="color:#c5a059;font-weight:600;">Por seguridad, el enlace caduca en 60 minutos.</span>`,
    highlights: [
      'El enlace es válido por 60 minutos',
      'Si no solicitaste este cambio, ignora el mensaje',
      'No compartas este enlace con nadie',
      'Protegemos tus datos con estándares de la industria'
    ],
    extra: `<div style="background:#fdf7e9; border:1px solid #e9d8a6; padding:12px 16px; border-radius:6px; color:#1e293b;">
      <strong style="color:#c5a059;">Consejo:</strong> Crea una contraseña robusta combinando mayúsculas, minúsculas, números y símbolos.
    </div>`,
    actionUrl: resetUrl,
    actionText: 'Restablecer contraseña',
    footer: `Si no solicitaste este cambio, ignora este mensaje. No compartas este enlace.<br/><span style="color:#c5a059;">Elite Advisors</span>`,
    supportUrl: `${clientUrl}/faq`,
    supportText: 'Centro de Ayuda'
  })
  const text = `Hola ${name || ''},\n\nHas solicitado restablecer tu contraseña en Elite Advisors.\nPor seguridad, el enlace caduca en 60 minutos.\n\nEnlace: ${resetUrl}\n\nSi no solicitaste este cambio, ignora este mensaje. No compartas este enlace.\n\nElite Advisors`
  return { subject, html, text }
}
