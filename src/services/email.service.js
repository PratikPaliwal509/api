const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

exports.sendEmail = async ({ to, subject, html }) => {
  return transporter.sendMail({
    from: `"TLS CRM" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  })
}
