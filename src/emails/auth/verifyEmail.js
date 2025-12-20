import { renderEmail } from '../layout.js'

export function buildVerifyEmailMail({ name, verifyUrl, clientUrl }) {
  const subject = 'Confirma tu correo'
  const html = renderEmail({
    title: 'Confirmar tu correo',
    subtitle: 'Activación de cuenta',
    greeting: `Hola ${name || ''},`,
    message: 'Para proteger tu cuenta y acceder a todos los beneficios, confirma tu correo electrónico.',
    highlights: [
      'La verificación activa tu cuenta',
      'Te permitirá acceder a todas las funcionalidades',
      'Este proceso mejora la seguridad'
    ],
    actionUrl: verifyUrl,
    actionText: 'Confirmar correo',
    footer: 'Si no solicitaste esta cuenta, ignora este mensaje.',
    supportUrl: `${clientUrl}/faq`,
    supportText: 'Centro de Ayuda'
  })
  const text = `Hola ${name || ''},\n\nPara proteger tu cuenta y acceder a todos los beneficios, confirma tu correo electrónico.\n\nEnlace: ${verifyUrl}\n\nSi no solicitaste esta cuenta, ignora este mensaje.`
  return { subject, html, text }
}
