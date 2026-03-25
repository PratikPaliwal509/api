const { sendEmail } = require('../services/email.service');

exports.sendEmailController = async (req, res) => {
  try {
    const { to, subject, html } = req.body;

    // ✅ validation
    if (!to || !subject || !html) {
      return res.status(400).json({
        success: false,
        message: 'to, subject and html are required',
      });
    }

    // ✅ send email
    await sendEmail({ to, subject, html });

    return res.status(200).json({
      success: true,
      message: 'Email sent successfully',
    });

  } catch (error) {
    console.error('Email Controller Error:', error);

    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to send email',
    });
  }
};