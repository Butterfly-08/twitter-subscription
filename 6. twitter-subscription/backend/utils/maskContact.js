const maskEmail = (email) => {
  if (!email) return '';
  const [localPart, domain] = email.split('@');
  if (!domain) return email;
  const maskedLocal = localPart.charAt(0) + '***';
  return `${maskedLocal}@${domain}`;
};

const maskMobile = (mobile) => {
  if (!mobile) return '';
  // Assuming E.164 format, e.g., +919876543210
  if (mobile.length > 4) {
    const start = mobile.slice(0, 3);
    const end = mobile.slice(-4);
    const maskedMiddle = 'X'.repeat(mobile.length - 7);
    return `${start}${maskedMiddle}${end}`;
  }
  return mobile;
};

module.exports = { maskEmail, maskMobile };
