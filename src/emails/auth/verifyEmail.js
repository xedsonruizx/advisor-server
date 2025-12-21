import { renderEmail } from '../layout.js'

export function buildVerifyEmailMail({ name, verifyUrl, clientUrl }) {
  const subject = 'Confirma tu correo — Elite Advisors'
  const html = renderEmail({
    title: 'Confirmar tu correo',
    subtitle: 'Activación de cuenta',
    badge: 'Verificación requerida',
    greeting: `Hola ${name || ''},`,
    message: `Gracias por registrarte en Elite Advisors. Para proteger tu cuenta y acceder a todos los beneficios, confirma tu dirección de correo electrónico.<br/><span style="color:#c5a059;font-weight:600;">Este enlace es válido por 24 horas.</span>`,
    highlights: [
      'Activa tu acceso completo a la plataforma',
      'Garantiza la seguridad de tu cuenta',
      'Recibe notificaciones importantes',
      'Accede a soporte prioritario'
    ],
    extra: `<div style="background:#fdf7e9; border:1px solid #e9d8a6; padding:12px 16px; border-radius:6px; color:#1e293b;">
      <strong style="color:#c5a059;">Bienvenido a la excelencia:</strong> Estamos comprometidos con brindarte la mejor asesoría legal del mercado.
    </div>`,
    actionUrl: verifyUrl,
    actionText: 'Confirmar correo',
    footer: `Si no creaste esta cuenta, puedes ignorar este mensaje de forma segura.<br/><span style="color:#c5a059;">Elite Advisors</span>`,
    supportUrl: `${clientUrl}/faq`,
    supportText: 'Centro de Ayuda'
  })
  const text = `Hola ${name || ''},\n\nGracias por registrarte en Elite Advisors. Para proteger tu cuenta y acceder a todos los beneficios, confirma tu dirección de correo electrónico.\n\nEnlace: ${verifyUrl}\n\nSi no creaste esta cuenta, ignora este mensaje.\n\nElite Advisors`
  return { subject, html, text }
}
