const crypto = require('crypto');

const generateBookingReference = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `EV-${dateStr}-${randomHex}`;
};

module.exports = generateBookingReference;
