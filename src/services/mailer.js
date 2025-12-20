import nodemailer from 'nodemailer'
import { renderEmail as renderEmailLayout } from '../emails/layout.js'

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT || 2525),
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  },
  pool: true,
  logger: process.env.NODE_ENV !== 'production',
  debug: process.env.NODE_ENV !== 'production'
})

export async function sendMail({ to, subject, html, text }) {
  const from = process.env.MAIL_FROM || 'Elite Advisors <no-reply@elite.local>'
  const message = { from, to, subject, html, text }
  try {
    await transporter.verify()
    const info = await transporter.sendMail(message)
    console.log('Correo enviado', {
      para: to,
      asunto: subject,
      id: info?.messageId,
      aceptados: info?.accepted,
      rechazados: info?.rejected
    })
    return info
  } catch (e) {
    console.error('Error al enviar correo', {
      para: to,
      asunto: subject,
      error: e?.message || String(e)
    })
    throw e
  }
}

export const renderEmail = (props) => renderEmailLayout(props)
