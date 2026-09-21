const express = require('express');
const {
  createVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  setDefaultVehicle,
} = require('../controllers/vehicleController');
const { protect } = require('../middleware/authMiddleware');
const {
  validate,
  vehicleValidationRules,
} = require('../middleware/validationMiddleware');

const router = express.Router();

router
  .route('/')
  .post(protect, vehicleValidationRules, validate, createVehicle)
  .get(protect, getVehicles);

router
  .route('/:id')
  .get(protect, getVehicleById)
  .put(protect, vehicleValidationRules, validate, updateVehicle)
  .delete(protect, deleteVehicle);

router.patch('/:id/default', protect, setDefaultVehicle);

module.exports = router;
