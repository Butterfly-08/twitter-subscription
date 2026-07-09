const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendInvoiceEmail = async ({ toEmail, userName, planName, amount, invoiceNumber, paymentId, date }) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e1e1e1; padding: 20px;">
      <h2 style="color: #1da1f2;">Payment Successful</h2>
      <p>Hi ${userName},</p>
      <p>Thank you for subscribing. Your payment has been received and your plan is now active.</p>

      <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Invoice No.</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${invoiceNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Plan</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${planName}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Amount Paid</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">₹${amount}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Payment ID</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${paymentId}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Date</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${date}</td>
        </tr>
      </table>

      <p style="margin-top: 20px;">If you have any questions about this invoice, just reply to this email.</p>
      <p>Thanks,<br/>Team</p>
    </div>
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: toEmail,
    subject: `Invoice ${invoiceNumber} - ${planName} Subscription`,
    html,
  };

  await transporter.sendMail(mailOptions);
};

const sendResetPasswordEmail = async ({ toEmail, userName, resetUrl }) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e1e1e1; padding: 20px;">
      <h2 style="color: #1da1f2;">Reset Your Password</h2>
      <p>Hi ${userName},</p>
      <p>We received a request to reset your password. Click the button below to set a new one. This link is valid for 30 minutes.</p>
      <p style="margin: 25px 0;">
        <a href="${resetUrl}" style="background: #1da1f2; color: white; padding: 10px 20px; border-radius: 20px; text-decoration: none;">Reset Password</a>
      </p>
      <p>If you didn't request this, you can safely ignore this email - your password will stay the same.</p>
      <p>Thanks,<br/>Team</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: toEmail,
    subject: 'Reset your password',
    html,
  });
};

module.exports = { sendInvoiceEmail, sendResetPasswordEmail };
