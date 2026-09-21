const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');

router.get('/stations', recommendationController.getRecommendations);

module.exports = router;
