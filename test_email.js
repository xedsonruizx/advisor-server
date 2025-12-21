import 'dotenv/config'
import { sendMail } from './src/services/mailer.js'
import { buildVerifyEmailMail } from './src/emails/auth/verifyEmail.js'

const email = process.argv[2]

if (!email) {
  console.error('❌ Error: Debes proporcionar un email de destino.')
  console.error('👉 Uso: node test_email.js tu@email.com')
  process.exit(1)
}

console.log('📧 Iniciando prueba de envío de correo...')
console.log(`📨 Destinatario: ${email}`)
console.log('⚙️  Configuración SMTP detectada:', {
  host: process.env.MAIL_HOST || '(no definido)',
  port: process.env.MAIL_PORT || '(no definido)',
  user: process.env.MAIL_USER || '(no definido)',
  secure: false
})

async function main() {
  try {
    console.log('🔄 Generando plantilla con nuevo diseño...')
    
    // Generar correo real usando la plantilla actualizada
    const mail = buildVerifyEmailMail({
      name: 'Usuario de Prueba',
      verifyUrl: 'http://localhost:5173/test-verification-link',
      clientUrl: process.env.CLIENT_URL || 'http://localhost:5173'
    })

    console.log('🔄 Intentando conectar y enviar...')
    const info = await sendMail({
      to: email,
      subject: mail.subject + ' [TEST]',
      html: mail.html,
      text: mail.text
    })
    
    console.log('✅ ¡CORREO ENVIADO CON ÉXITO!')
    console.log('🆔 Message ID:', info.messageId)
    console.log('-----------------------------------')
    console.log('Ahora revisa tu bandeja de entrada (y spam).')
    console.log('Deberías ver el nuevo diseño con insignia dorada y estilos premium.')
    
  } catch (e) {
    console.error('❌ FALLÓ EL ENVÍO DE CORREO')
    console.error('-----------------------------------')
    console.error('Detalles del error:')
    console.error(e.message)
    if (e.code === 'EAUTH') {
      console.error('💡 Pista: Parece un problema de autenticación. Revisa MAIL_USER y MAIL_PASS en tu archivo .env')
    } else if (e.code === 'ESOCKET') {
      console.error('💡 Pista: No se pudo conectar al servidor. Revisa MAIL_HOST y MAIL_PORT.')
    }
    process.exit(1)
  }
}

main()
