// generates a random password made only of letters, no numbers, no symbols
// keeps it simple to type/read while still having enough length to be reasonably secure

const UPPER_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWER_CHARS = 'abcdefghijklmnopqrstuvwxyz';
const ALL_CHARS = UPPER_CHARS + LOWER_CHARS;

function generateLetterPassword(length = 10) {
  let password = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * ALL_CHARS.length);
    password += ALL_CHARS[randomIndex];
  }

  // make sure there's at least one uppercase and one lowercase letter in there,
  // re-roll a couple of positions if the random draw happened to miss one
  if (!/[A-Z]/.test(password)) {
    const pos = Math.floor(Math.random() * length);
    password = password.substring(0, pos) + UPPER_CHARS[Math.floor(Math.random() * UPPER_CHARS.length)] + password.substring(pos + 1);
  }

  if (!/[a-z]/.test(password)) {
    const pos = Math.floor(Math.random() * length);
    password = password.substring(0, pos) + LOWER_CHARS[Math.floor(Math.random() * LOWER_CHARS.length)] + password.substring(pos + 1);
  }

  return password;
}

module.exports = generateLetterPassword;
