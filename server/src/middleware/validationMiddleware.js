const { validationResult, body, param, query } = require('express-validator');

// Reusable middleware to inspect express-validator results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err) => ({
        field: err.path || err.param,
        message: err.msg,
      })),
    });
  }
  next();
};

// Vehicle validation rules
const vehicleValidationRules = [
  body('vehicleNumber')
    .trim()
    .notEmpty()
    .withMessage('Vehicle number is required')
    .isLength({ min: 3, max: 20 })
    .withMessage('Vehicle number must be between 3 and 20 characters'),
  body('brand').trim().notEmpty().withMessage('Brand is required'),
  body('model').trim().notEmpty().withMessage('Model is required'),
  body('batteryCapacity')
    .notEmpty()
    .withMessage('Battery capacity is required')
    .isFloat({ min: 1 })
    .withMessage('Battery capacity must be at least 1 kWh'),
  body('connectorType')
    .notEmpty()
    .withMessage('Connector type is required')
    .isIn(['CCS2', 'Type 2', 'CHAdeMO', 'GB/T', 'Other'])
    .withMessage('Invalid connector type'),
  body('manufacturingYear')
    .optional({ checkFalsy: true })
    .isInt({ min: 1990, max: new Date().getFullYear() + 1 })
    .withMessage('Manufacturing year is not valid'),
  body('maxChargingPower')
    .optional({ checkFalsy: true })
    .isFloat({ min: 1 })
    .withMessage('Max charging power must be at least 1 kW'),
  body('isDefault')
    .optional()
    .isBoolean()
    .withMessage('isDefault must be a boolean'),
];

// Station validation rules
const stationValidationRules = [
  body('name').trim().notEmpty().withMessage('Station name is required'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('latitude')
    .notEmpty()
    .withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('longitude')
    .notEmpty()
    .withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('pricePerKwh')
    .notEmpty()
    .withMessage('Price per kWh is required')
    .isFloat({ min: 0 })
    .withMessage('Price per kWh must be a non-negative number'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'maintenance'])
    .withMessage('Invalid station status'),
  body('facilities')
    .optional()
    .isArray()
    .withMessage('Facilities must be an array of strings'),
];

// Charger validation rules
const chargerValidationRules = [
  body('chargerNumber').trim().notEmpty().withMessage('Charger number is required'),
  body('connectorType')
    .notEmpty()
    .withMessage('Connector type is required')
    .isIn(['CCS2', 'Type 2', 'CHAdeMO', 'GB/T', 'Other'])
    .withMessage('Invalid connector type'),
  body('chargingSpeed')
    .notEmpty()
    .withMessage('Charging speed is required')
    .isIn(['Slow', 'Normal', 'Fast', 'Rapid'])
    .withMessage('Invalid charging speed'),
  body('powerRating')
    .notEmpty()
    .withMessage('Power rating is required')
    .isFloat({ min: 1 })
    .withMessage('Power rating must be at least 1 kW'),
  body('status')
    .optional()
    .isIn(['available', 'reserved', 'charging', 'maintenance', 'offline'])
    .withMessage('Invalid charger status'),
  body('pricePerKwh')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage('Price per kWh must be a non-negative number'),
];

module.exports = {
  validate,
  vehicleValidationRules,
  stationValidationRules,
  chargerValidationRules,
};
