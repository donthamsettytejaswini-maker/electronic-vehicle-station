const crypto = require('crypto');

const generatePaymentReference = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `PAY-${dateStr}-${randomHex}`;
};

module.exports = generatePaymentReference;
