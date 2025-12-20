import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT || 2525),
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
})

export async function sendMail({ to, subject, html, text }) {
  const from = process.env.MAIL_FROM || 'Elite Advisors <no-reply@elite.local>'
  const message = { from, to, subject, html, text }
  return transporter.sendMail(message)
}
