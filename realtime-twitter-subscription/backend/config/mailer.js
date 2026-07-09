const nodemailer = require('nodemailer');
const env = require('./env');

let transporter;

if (env.SMTP_USER && env.SMTP_PASS) {
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
  console.warn('[DEV MODE] No SMTP credentials provided, using mocked console mailer.');
  transporter = {
    sendMail: async (mailOptions) => {
      console.log('====== MOCKED EMAIL ======');
      console.log(`To: ${mailOptions.to}`);
      console.log(`Subject: ${mailOptions.subject}`);
      console.log(`Body: \n${mailOptions.text}`);
      if (mailOptions.html) {
        console.log(`HTML Body: \n${mailOptions.html}`);
      }
      console.log('==========================');
      return { messageId: 'mock-id-' + Date.now() };
    }
  };
}

module.exports = transporter;
