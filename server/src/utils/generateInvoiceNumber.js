const crypto = require('crypto');

const generateInvoiceNumber = () => {
  const year = new Date().getFullYear();
  const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `INV-${year}-${randomHex}`;
};

module.exports = generateInvoiceNumber;
