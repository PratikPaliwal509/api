const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // VERY IMPORTANT
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

exports.sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"TLS CRM" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    })

    console.log('Email sent:', info.messageId)
    return info
  } catch (error) {
    console.error('Email error:', error)
    throw error
  }
}