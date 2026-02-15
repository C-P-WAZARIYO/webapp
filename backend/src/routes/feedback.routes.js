/**
 * Feedback Routes
 */

const express = require('express');
const feedbackController = require('../controllers/feedback.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * Feedback Submission Routes
 */

// Submit feedback (Executive)
router.post('/', authorize(['field_executive']), feedbackController.submitFeedback);

// Get single feedback
router.get('/:feedbackId', feedbackController.getFeedbackById);

// Get all feedbacks for a case
router.get('/case/:caseId', feedbackController.getFeedbacksByCase);

// Get all feedbacks for an executive
router.get('/executive/:executiveId', feedbackController.getFeedbacksByExecutive);

/**
 * Audit Routes (Supervisor & Admin)
 */

// Mark feedback as fake visit (manual audit)
router.post('/:feedbackId/mark-fake', authorize(['super_admin', 'supervisor']), feedbackController.markAsFakeVisit);

// Reject feedback
router.delete('/:feedbackId', authorize(['super_admin', 'supervisor']), feedbackController.rejectFeedback);

// Get fake visit summary
router.get('/audit/fake-visits', authorize(['super_admin', 'supervisor']), feedbackController.getFakeVisitSummary);

/**
 * PTP (Promise to Pay) Routes
 */

// Get PTP alerts
router.get('/alerts/ptp', authorize(['super_admin', 'supervisor']), feedbackController.getPTPAlerts);

// Check for broken PTPs (scheduled task)
router.post('/check-broken-ptp', authorize(['super_admin']), feedbackController.checkBrokenPTP);

module.exports = router;
