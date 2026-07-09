const smsClient = require('../config/smsProvider');
const env = require('../config/env');

const templates = {
  en: (otp) => `Your OTP to change website language is ${otp}. Valid for 5 minutes. Do not share this code with anyone. — [MyApp]`,
  es: (otp) => `Su OTP para cambiar el idioma del sitio web es ${otp}. Válido por 5 minutos. No comparta este código con nadie. — [MyApp]`,
  // Others fallback to English
};

const sendOtpSms = async (mobileNumber, otp, currentLang = 'en') => {
  const template = templates[currentLang] || templates['en'];
  const body = template(otp);

  return smsClient.messages.create({
    body: body,
    from: env.TWILIO_PHONE_NUMBER || env.SMS_PROVIDER_SENDER_ID,
    to: mobileNumber
  });
};

module.exports = { sendOtpSms };
