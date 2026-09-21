const express = require('express');
const router = express.Router();
const fleetController = require('../controllers/fleetController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/my-org', fleetController.getMyOrganizations);
router.post('/organizations', fleetController.createOrganization);
router.get('/organizations', fleetController.getMyOrganizations);
router.get('/organizations/:id', fleetController.getOrganizationById);
router.post('/members', fleetController.addMember);
router.post('/organizations/:id/members', fleetController.addMember);
router.get('/organizations/:id/members', fleetController.getOrganizationMembers);
router.get('/organizations/:id/report', fleetController.getFleetReports);
router.get('/organizations/:id/reports', fleetController.getFleetReports);

module.exports = router;
