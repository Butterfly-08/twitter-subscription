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

const sendNewPasswordEmail = async ({ toEmail, userName, newPassword }) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e1e1e1; padding: 20px;">
      <h2 style="color: #1da1f2;">Your Password Has Been Reset</h2>
      <p>Hi ${userName},</p>
      <p>As requested, here is your new temporary password:</p>
      <p style="margin: 20px 0; text-align: center;">
        <span style="display: inline-block; background: #f5f8fa; border: 1px dashed #1da1f2; padding: 10px 24px; font-size: 18px; font-weight: bold; letter-spacing: 2px; border-radius: 6px;">${newPassword}</span>
      </p>
      <p>Please log in with this password, and we recommend changing it to something memorable afterwards.</p>
      <p>If you didn't request this, please contact support immediately since someone else may have access to your account.</p>
      <p>Thanks,<br/>Team</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: toEmail,
    subject: 'Your new password',
    html,
  });
};

module.exports = { sendInvoiceEmail, sendNewPasswordEmail };
