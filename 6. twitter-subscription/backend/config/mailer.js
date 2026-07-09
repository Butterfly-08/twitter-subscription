const nodemailer = require('nodemailer');
const env = require('./env');

let transporter;

if (env.SMTP_USER && env.SMTP_PASS && env.SMTP_HOST !== 'smtp.ethereal.email') {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
} else {
  console.warn('No valid SMTP credentials provided, using mocked console mailer.');
  transporter = {
    sendMail: async (mailOptions) => {
      console.log('====== MOCKED EMAIL ======');
      console.log(`To: ${mailOptions.to}`);
      console.log(`Subject: ${mailOptions.subject}`);
      console.log(`Body: \n${mailOptions.text}`);
      console.log('==========================');
      return { messageId: 'mock-id-' + Date.now() };
    }
  };
}

module.exports = transporter;
