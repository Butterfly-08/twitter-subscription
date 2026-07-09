let KEYWORDS = ['cricket', 'science'];

// Allow override from env
if (process.env.NOTIFICATION_KEYWORDS) {
  KEYWORDS = process.env.NOTIFICATION_KEYWORDS.split(',').map(k => k.trim());
}

function detectKeywords(text) {
  const matched = KEYWORDS.filter(kw =>
    new RegExp(`\\b${kw}\\b`, 'i').test(text)
  );
  return { isNotifiable: matched.length > 0, matchedKeywords: matched };
}

module.exports = { detectKeywords, KEYWORDS };
