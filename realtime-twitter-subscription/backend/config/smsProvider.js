const env = require('./env');
const twilio = require('twilio');

let smsClient;

if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN) {
  smsClient = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
} else {
  console.warn('[DEV MODE] No Twilio credentials provided, using mocked console SMS provider.');
  smsClient = {
    messages: {
      create: async (msgOptions) => {
        console.log('====== MOCKED SMS ======');
        console.log(`To: ${msgOptions.to}`);
        console.log(`From: ${msgOptions.from || 'MOCK_SENDER'}`);
        console.log(`Body: ${msgOptions.body}`);
        console.log('========================');
        return { sid: 'mock-sid-' + Date.now() };
      }
    }
  };
}

module.exports = smsClient;
