const nodemailer = require('nodemailer')

let transporter = null

// Uses the SMTP settings from .env. Without SMTP_HOST (development) the email is only printed in the console.
function getTransporter() {
  if (!process.env.SMTP_HOST) return null
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT) || 587
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    })
  }
  return transporter
}

async function sendPasswordResetEmail({ to, name, link, minutes }) {
  const mailer = getTransporter()
  if (!mailer) {
    console.log(`\n[Password reset] SMTP is not set up, so no email was sent.\n  For: ${to}\n  Link (valid ${minutes} min): ${link}\n`)
    return
  }
  await mailer.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject: 'ShramikKhata - Reset your password',
    text:
      `Namaste ${name},\n\nTap this link to set a new password (valid for ${minutes} minutes):\n${link}\n\n` +
      'If you did not ask for this, you can ignore this email.\n\nShramikKhata - Digital Labour Register',
  })
}

module.exports = { sendPasswordResetEmail }
