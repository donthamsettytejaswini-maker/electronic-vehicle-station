const express = require('express');
const {
  getChargerById,
  updateCharger,
  updateChargerStatus,
  deleteCharger,
} = require('../controllers/chargerController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');

const router = express.Router();

router
  .route('/:id')
  .get(getChargerById)
  .put(protect, adminOnly, updateCharger)
  .delete(protect, adminOnly, deleteCharger);

router.patch('/:id/status', protect, adminOnly, updateChargerStatus);

module.exports = router;
