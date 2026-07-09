const mailer = require('../config/mailer');
const env = require('../config/env');

const templates = {
  en: {
    subject: 'Your Verification Code to Switch Language',
    body: (userName, otp) => `Hello ${userName},\n\nYou requested to change your website language to French (Français).\nYour One-Time Password (OTP) is: ${otp}\n\nThis code is valid for 5 minutes. Do not share this code with anyone.\nIf you did not request this change, please ignore this email or contact support.\n\n— Support Team`
  },
  es: {
    subject: 'Su código de verificación para cambiar de idioma',
    body: (userName, otp) => `Hola ${userName},\n\nHa solicitado cambiar el idioma de su sitio web a francés (Français).\nSu contraseña de un solo uso (OTP) es: ${otp}\n\nEste código es válido por 5 minutos. No comparta este código con nadie.\nSi no solicitó este cambio, ignore este correo electrónico o comuníquese con el soporte.\n\n— Equipo de soporte`
  },
  // Adding fallbacks to English for simplicity in this example
};

const sendOtpEmail = async (email, otp, currentLang = 'en', userName = 'User') => {
  const template = templates[currentLang] || templates['en'];
  
  const mailOptions = {
    from: env.EMAIL_FROM,
    to: email,
    subject: template.subject,
    text: template.body(userName, otp),
  };

  return mailer.sendMail(mailOptions);
};

module.exports = { sendOtpEmail };
