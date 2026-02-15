/**
 * Case Controller
 * Handles case management endpoints
 */

const { body, validationResult, query } = require('express-validator');
const caseService = require('../services/case.service');
const feedbackService = require('../services/feedback.service');
const payoutService = require('../services/payout.service');
const xlsx = require('xlsx');
const multer = require('multer');
const crypto = require('crypto');
const prisma = require('../config/database');

// multer memory storage
const uploadMiddleware = multer({ storage: multer.memoryStorage() });

/**
 * Upload Excel and bulk create cases (Supervisor)
 * POST /api/cases/upload
 */
const uploadCases = async (req, res) => {
  try {
    // multer puts file in req.file when used as middleware
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const buffer = req.file.buffer;

    // Encrypt and save original file (if key provided)
    const encKey = process.env.UPLOAD_ENC_KEY || null; // must be 32 bytes for aes-256
    let savedFilename = null;
    if (encKey) {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(encKey, 'hex'), iv);
      const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
      const out = Buffer.concat([iv, encrypted]);
      const filename = `uploads/upload_${Date.now()}.enc`;
      const fs = require('fs');
      fs.mkdirSync('uploads', { recursive: true });
      fs.writeFileSync(filename, out);
      savedFilename = filename;
    }

    // Parse excel using xlsx
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(worksheet, { defval: '' });

    // Map rows to case objects
    const casesArray = [];
    for (const r of rows) {
      // Normalize keys (common variants)
      const acc_no = r['Acc_no'] || r['Acc No'] || r['Account'] || r['acc_no'] || r['acc_id'] || r['Acc ID'];
      if (!acc_no) continue; // skip invalid rows

      const empId = r['emp_id'] || r['Emp_id'] || r['EMP_ID'] || r['emp id'] || r['Emp ID'];

      // Try to find user by emp_id to assign executiveId
      let executiveId = null;
      if (empId) {
        const user = await prisma.user.findUnique({ where: { emp_id: empId } });
        if (user) executiveId = user.id;
      }

      const caseObj = {
        acc_id: String(acc_no).trim(),
        customer_name: r['Acc_holder_name'] || r['Account Holder Name'] || r['Name'] || r['acc_holder_name'] || '',
        address: r['Acc_holder_address'] || r['Address'] || r['acc_holder_address'] || '',
        bank_name: r['Bank name'] || r['Bank'] || r['bank_name'] || '',
        product_type: r['product name'] || r['Product'] || r['product_name'] || '',
        bkt: r['bkt'] || r['BKT'] || '',
        priority: r['importance'] || r['Importance'] || '',
        pos_amount: parseFloat(r['pos amount'] || r['Pos amount'] || r['pos_amount'] || 0) || 0,
        npa_status: r['npa status'] || r['NPA Status'] || r['npa_status'] || '',
        emp_id: empId || null,
        executiveId,
        upload_mode: 'ORIGINAL',
      };
      casesArray.push(caseObj);
    }

    // Create cases in bulk
    const supervisorId = req.user?.id || null;
    const result = await caseService.bulkCreateCases(casesArray, supervisorId, 'ORIGINAL');

    // Check ACR per executive (count cases per executiveId or emp_id)
    const counts = {};
    for (const c of result.cases) {
      const key = c.executiveId || c.emp_id || 'unassigned';
      counts[key] = (counts[key] || 0) + 1;
    }
    const overloaded = Object.entries(counts).filter(([k, v]) => v > 100).map(([k, v]) => ({ id: k, count: v }));

    res.status(201).json({ success: true, data: { upload: result.upload, created: result.cases.length, overloaded, savedFilename } });
  } catch (error) {
    console.error('Upload cases failed', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Create a single case
 * POST /api/cases
 */
const createCase = async (req, res) => {
  try {
    const { acc_id, customer_name, pos_amount, bkt, product_type, bank_name, emp_id } = req.body;

    const caseRecord = await caseService.createCase({
      acc_id,
      customer_name,
      pos_amount,
      bkt,
      product_type,
      bank_name,
      emp_id,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
    });

    res.status(201).json({
      success: true,
      message: 'Case created successfully',
      data: caseRecord,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get cases for executive
 * GET /api/cases/executive/:executiveId
 */
const getCasesForExecutive = async (req, res) => {
  try {
    const { executiveId } = req.params;
    const { bkt, product_type, npa_status, priority, status } = req.query;

    const filters = {};
    if (bkt) filters.bkt = bkt;
    if (product_type) filters.product_type = product_type;
    if (npa_status) filters.npa_status = npa_status;
    if (priority) filters.priority = priority;
    if (status) filters.status = status;

    const cases = await caseService.getCasesForExecutive(executiveId, filters);

    res.status(200).json({
      success: true,
      data: cases,
      total: cases.length,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get single case with all feedbacks
 * GET /api/cases/:caseId
 */
const getCaseById = async (req, res) => {
  try {
    const { caseId } = req.params;
    const caseRecord = await caseService.getCaseById(caseId);

    if (!caseRecord) {
      return res.status(404).json({
        success: false,
        message: 'Case not found',
      });
    }

    res.status(200).json({
      success: true,
      data: caseRecord,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get performance summary for executive
 * GET /api/cases/performance/:executiveId
 */
const getPerformance = async (req, res) => {
  try {
    const { executiveId } = req.params;
    const { month, year } = req.query;

    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();

    const performance = await caseService.getExecutivePerformance(executiveId, currentMonth, currentYear);

    res.status(200).json({
      success: true,
      data: performance,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get all cases (with filters) - for Supervisor
 * GET /api/cases
 */
const getAllCases = async (req, res) => {
  try {
    const { status, bkt, product_type, month, year, bank_name, limit, offset } = req.query;

    const filters = {
      limit: limit ? parseInt(limit) : 100,
      offset: offset ? parseInt(offset) : 0,
    };

    if (status) filters.status = status;
    if (bkt) filters.bkt = bkt;
    if (product_type) filters.product_type = product_type;
    if (month) filters.month = parseInt(month);
    if (year) filters.year = parseInt(year);
    if (bank_name) filters.bank_name = bank_name;

    const result = await caseService.getAllCases(filters);

    res.status(200).json({
      success: true,
      data: result.cases,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get case by account id (acc_id)
 * GET /api/cases/lookup?acc_id=ACC123
 */
const getCaseByAccId = async (req, res) => {
  try {
    const { acc_id } = req.query;
    if (!acc_id) {
      return res.status(400).json({ success: false, message: 'Missing acc_id query parameter' });
    }

    const caseRecord = await caseService.getCaseByAccId(acc_id);
    if (!caseRecord) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    res.status(200).json({ success: true, data: caseRecord });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Allocate cases to executive
 * POST /api/cases/allocate
 */
const allocateCases = async (req, res) => {
  try {
    const { emp_id, executiveId } = req.body;

    const result = await caseService.allocateCasesToExecutive(emp_id, executiveId);

    res.status(200).json({
      success: true,
      message: `${result.count} cases allocated`,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Bulk allocate cases
 * POST /api/cases/allocate/bulk
 */
const bulkAllocate = async (req, res) => {
  try {
    const { allocations } = req.body; // [{ emp_id, executiveId }, ...]

    const results = await caseService.bulkAllocateCases(allocations);

    res.status(200).json({
      success: true,
      message: 'Bulk allocation completed',
      data: results,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createCase,
  getCasesForExecutive,
  getCaseById,
  getPerformance,
  getAllCases,
  allocateCases,
  bulkAllocate,
  getCaseByAccId,
  uploadCases,
};
