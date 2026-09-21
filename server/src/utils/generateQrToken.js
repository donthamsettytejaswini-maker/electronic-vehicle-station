const crypto = require('crypto');

function generateRawQrToken() {
  return crypto.randomBytes(32).toString('hex');
}

function hashQrToken(token) {
  if (!token) return '';
  return crypto.createHash('sha256').update(token).digest('hex');
}

function verifyQrToken(providedToken, storedHash) {
  if (!providedToken || !storedHash) return false;
  const providedHash = hashQrToken(providedToken);
  try {
    const a = Buffer.from(providedHash, 'hex');
    const b = Buffer.from(storedHash, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch (err) {
    return providedHash === storedHash;
  }
}

module.exports = {
  generateRawQrToken,
  hashQrToken,
  verifyQrToken,
};
