const Joi = require('joi');
const auditLogService = require('../services/auditLogService');
const { AUDIT_CATEGORIES, AUDIT_ACTIONS } = require('../constants/auditActions');

const listSchema = Joi.object({
    category: Joi.string().valid('all', ...AUDIT_CATEGORIES).optional(),
    action: Joi.string().valid('all', ...Object.values(AUDIT_ACTIONS)).optional(),
    search: Joi.string().trim().allow('').optional(),
    startDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
});

const listAuditLogs = async (req, res) => {
    const result = await auditLogService.listAuditLogs(
        req.currentUser,
        req.validated?.query || {}
    );
    res.json(result);
};

const listFinanceAuditLogs = async (req, res) => {
    const result = await auditLogService.listFinanceAuditLogs(
        req.currentUser,
        req.validated?.query || {}
    );
    res.json(result);
};

module.exports = {
    listSchema,
    listAuditLogs,
    listFinanceAuditLogs,
};
