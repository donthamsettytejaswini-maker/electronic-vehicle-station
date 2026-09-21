const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');

// Public: Get published reviews for a station
router.get('/stations/:stationId/reviews', reviewController.getStationReviews);

// Protected User Routes
router.post('/reviews', protect, reviewController.createReview);
router.put('/reviews/:id', protect, reviewController.updateReview);
router.delete('/reviews/:id', protect, reviewController.deleteReview);

// Admin Moderation Routes
router.get('/admin/reviews', protect, adminOnly, reviewController.getAdminReviews);
router.patch('/admin/reviews/:id/status', protect, adminOnly, reviewController.updateReviewStatus);

module.exports = router;
