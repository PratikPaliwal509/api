// const nodemailer = require('nodemailer')

// const transporter = nodemailer.createTransport({
//   host: 'smtp.gmail.com',
//   port: 587,
//   secure: false, // VERY IMPORTANT
//   auth: {
//     user: process.env.GMAIL_USER,
//     pass: process.env.GMAIL_APP_PASSWORD,
//   },
//   tls: {
//     rejectUnauthorized: false, // helps in cloud env
//   },
//   connectionTimeout: 100000, 
// })

// exports.sendEmail = async ({ to, subject, html }) => {
//   try {
//     const info = await transporter.sendMail({
//       from: `"TLS CRM" <${process.env.GMAIL_USER}>`,
//       to,
//       subject,
//       html,
//     })

//     return info
//   } catch (error) {
//     console.error('Email error:', error)
//     throw error
//   }
// }
const SibApiV3Sdk = require('sib-api-v3-sdk'); // ✅ correct package

const defaultClient = SibApiV3Sdk.ApiClient.instance;

// Configure API key
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

exports.sendEmail = async ({ to, subject, html }) => {
  try {
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    sendSmtpEmail.to = [{ email: to }];
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = html;

    sendSmtpEmail.sender = {
      name: "TLS CRM",
      email: "pratikpaliwal355@gmail.com", // MUST verify in Brevo
    };

    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);

    return response;

  } catch (error) {
    console.error("Email Error:", error);
    throw error;
  }
};