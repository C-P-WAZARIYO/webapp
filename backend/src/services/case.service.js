/**
 * Case Service
 * Handles case management, upload, allocation, and performance tracking
 */

const prisma = require('../config/database');

/**
 * Create a single case
 */
const createCase = async (caseData) => {
  try {
    const caseRecord = await prisma.case.create({
      data: {
        acc_id: caseData.acc_id,
        cust_id: caseData.cust_id,
        customer_name: caseData.customer_name,
        phone_number: caseData.phone_number,
        address: caseData.address,
        pincode: caseData.pincode,
        lat: caseData.lat,
        lng: caseData.lng,
        pos_amount: caseData.pos_amount || 0,
        overdue_amount: caseData.overdue_amount || 0,
        dpd: caseData.dpd || 0,
        bkt: caseData.bkt,
        product_type: caseData.product_type,
        bank_name: caseData.bank_name,
        npa_status: caseData.npa_status,
        priority: caseData.priority,
        emp_id: caseData.emp_id,
        executiveId: caseData.executiveId || null,
        month: caseData.month || new Date().getMonth() + 1,
        year: caseData.year || new Date().getFullYear(),
        upload_mode: caseData.upload_mode || 'ORIGINAL',
      },
    });
    return caseRecord;
  } catch (error) {
    throw new Error(`Failed to create case: ${error.message}`);
  }
};

/**
 * Bulk create cases from Excel upload
 */
const bulkCreateCases = async (casesArray, supervisorId, uploadMode = 'ORIGINAL') => {
  try {
    // Create upload record
    const upload = await prisma.caseUpload.create({
      data: {
        supervisorId,
        filename: `upload_${Date.now()}`,
        upload_mode: uploadMode,
        total_cases: casesArray.length,
      },
    });

    // Bulk create cases
    const createdCases = await Promise.all(
      casesArray.map((caseData) =>
        createCase({
          ...caseData,
          upload_mode: uploadMode,
        })
      )
    );

    return {
      upload,
      cases: createdCases,
    };
  } catch (error) {
    throw new Error(`Failed to bulk create cases: ${error.message}`);
  }
};

/**
 * Allocate cases to executives based on emp_id
 * One emp_id can have multiple executives assigned (one-to-many)
 */
const allocateCasesToExecutive = async (emp_id, executiveId) => {
  try {
    const updated = await prisma.case.updateMany({
      where: { emp_id, executiveId: null }, // Only unallocated cases
      data: { executiveId },
    });
    return updated;
  } catch (error) {
    throw new Error(`Failed to allocate cases: ${error.message}`);
  }
};

/**
 * Allocate cases in batch for multiple executives
 */
const bulkAllocateCases = async (allocations) => {
  try {
    const results = [];
    for (const { emp_id, executiveId } of allocations) {
      const result = await allocateCasesToExecutive(emp_id, executiveId);
      results.push({ emp_id, executiveId, updated: result.count });
    }
    return results;
  } catch (error) {
    throw new Error(`Failed to bulk allocate cases: ${error.message}`);
  }
};

/**
 * Get cases for an executive
 */
const getCasesForExecutive = async (executiveId, filters = {}) => {
  try {
    const where = { executiveId };

    // Apply filters
    if (filters.bkt) where.bkt = filters.bkt;
    if (filters.product_type) where.product_type = filters.product_type;
    if (filters.npa_status) where.npa_status = filters.npa_status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.status) where.status = filters.status;

    const cases = await prisma.case.findMany({
      where,
      include: {
        feedbacks: true,
        executive: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return cases;
  } catch (error) {
    throw new Error(`Failed to fetch cases: ${error.message}`);
  }
};

/**
 * Get single case with all feedbacks
 */
const getCaseById = async (caseId) => {
  try {
    const caseRecord = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        feedbacks: {
          orderBy: { createdAt: 'desc' },
          include: {
            executive: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
        executive: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
    return caseRecord;
  } catch (error) {
    throw new Error(`Failed to fetch case: ${error.message}`);
  }
};

/**
 * Get single case by acc_id (account identifier)
 */
const getCaseByAccId = async (accId) => {
  try {
    const caseRecord = await prisma.case.findUnique({
      where: { acc_id: accId },
      include: {
        feedbacks: {
          orderBy: { createdAt: 'desc' },
        },
        executive: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
    return caseRecord;
  } catch (error) {
    throw new Error(`Failed to fetch case by acc_id: ${error.message}`);
  }
};

/**
 * Update case status
 */
const updateCaseStatus = async (caseId, status) => {
  try {
    const updated = await prisma.case.update({
      where: { id: caseId },
      data: { status },
    });
    return updated;
  } catch (error) {
    throw new Error(`Failed to update case status: ${error.message}`);
  }
};

/**
 * Get performance summary for an executive (Count-wise & POS-wise)
 */
const getExecutivePerformance = async (executiveId, month, year) => {
  try {
    const cases = await prisma.case.findMany({
      where: {
        executiveId,
        month,
        year,
      },
      include: {
        feedbacks: true,
      },
    });

    // Calculate metrics
    const totalCases = cases.length;
    const visitedCases = cases.filter((c) => c.feedbacks.length > 0).length;
    const totalPOS = cases.reduce((sum, c) => sum + (c.pos_amount || 0), 0);
    const recoveredPOS = cases
      .filter((c) => c.status === 'PAID' || c.status === 'CLOSED')
      .reduce((sum, c) => sum + (c.pos_amount || 0), 0);

    // Group by BKT and Product
    const byBKT = {};
    const byProduct = {};

    cases.forEach((c) => {
      if (!byBKT[c.bkt]) {
        byBKT[c.bkt] = { count: 0, pos: 0, visited: 0 };
      }
      byBKT[c.bkt].count += 1;
      byBKT[c.bkt].pos += c.pos_amount || 0;
      if (c.feedbacks.length > 0) byBKT[c.bkt].visited += 1;

      if (!byProduct[c.product_type]) {
        byProduct[c.product_type] = { count: 0, pos: 0, visited: 0 };
      }
      byProduct[c.product_type].count += 1;
      byProduct[c.product_type].pos += c.pos_amount || 0;
      if (c.feedbacks.length > 0) byProduct[c.product_type].visited += 1;
    });

    return {
      totalCases,
      visitedCases,
      visitRate: totalCases > 0 ? (visitedCases / totalCases) * 100 : 0,
      totalPOS,
      recoveredPOS,
      recoveryRate: totalPOS > 0 ? (recoveredPOS / totalPOS) * 100 : 0,
      byBKT,
      byProduct,
    };
  } catch (error) {
    throw new Error(`Failed to fetch performance data: ${error.message}`);
  }
};

/**
 * Get all cases by filters (for Supervisor dashboard)
 */
const getAllCases = async (filters = {}) => {
  try {
    const where = {};

    if (filters.status) where.status = filters.status;
    if (filters.bkt) where.bkt = filters.bkt;
    if (filters.product_type) where.product_type = filters.product_type;
    if (filters.month) where.month = filters.month;
    if (filters.year) where.year = filters.year;
    if (filters.bank_name) where.bank_name = filters.bank_name;

    const cases = await prisma.case.findMany({
      where,
      include: {
        feedbacks: true,
        executive: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 100,
      skip: filters.offset || 0,
    });

    const total = await prisma.case.count({ where });

    return {
      cases,
      total,
      limit: filters.limit || 100,
      offset: filters.offset || 0,
    };
  } catch (error) {
    throw new Error(`Failed to fetch cases: ${error.message}`);
  }
};

module.exports = {
  createCase,
  bulkCreateCases,
  allocateCasesToExecutive,
  bulkAllocateCases,
  getCasesForExecutive,
  getCaseById,
  updateCaseStatus,
  getExecutivePerformance,
  getAllCases,
};
