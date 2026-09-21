const crypto = require('crypto');

const generateSessionReference = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `SESSION-${dateStr}-${randomHex}`;
};

module.exports = generateSessionReference;
