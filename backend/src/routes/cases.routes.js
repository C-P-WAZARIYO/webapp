/**
 * Case Routes
 */

const express = require('express');
const casesController = require('../controllers/cases.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * Case Management Routes
 */

// Create a single case
router.post('/', authorize(['super_admin', 'supervisor']), casesController.createCase);

// Get all cases (with filters) - Supervisor & Admin
router.get('/', authorize(['super_admin', 'supervisor', 'manager']), casesController.getAllCases);

// Get cases for a specific executive
router.get('/executive/:executiveId', casesController.getCasesForExecutive);

// Lookup case by account id (acc_id)
router.get('/lookup', casesController.getCaseByAccId);

// Upload cases via Excel (Supervisor)
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
router.post('/upload', upload.single('file'), authorize(['super_admin', 'supervisor']), casesController.uploadCases);

// Get performance summary for executive
router.get('/performance/:executiveId', casesController.getPerformance);

// Get single case with all feedbacks
router.get('/:caseId', casesController.getCaseById);

// Allocate cases to executive
router.post('/allocate/single', authorize(['super_admin', 'supervisor']), casesController.allocateCases);

// Bulk allocate cases
router.post('/allocate/bulk', authorize(['super_admin', 'supervisor']), casesController.bulkAllocate);

module.exports = router;
