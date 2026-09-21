const express = require('express');
const {
  startSession,
  getSessionById,
  getActiveSession,
  pauseSession,
  resumeSession,
  updateSession,
  completeSession,
  stopSession,
  getSessionHistory,
  getAllActiveSessions,
} = require('../controllers/sessionController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');

const router = express.Router();

router.post('/start', protect, startSession);
router.get('/active', protect, getActiveSession);
router.get('/history', protect, getSessionHistory);
router.get('/admin/active', protect, adminOnly, getAllActiveSessions);

router.get('/:id', protect, getSessionById);
router.patch('/:id/pause', protect, pauseSession);
router.patch('/:id/resume', protect, resumeSession);
router.patch('/:id/update', protect, updateSession);
router.patch('/:id/complete', protect, completeSession);
router.post('/:id/stop', protect, stopSession);

module.exports = router;
