const Joi = require('joi');
const shiftReconciliationService = require('../services/shiftReconciliationService');
const { ATTENDANCE_SESSIONS } = require('../constants/attendanceSessions');
const { RECONCILIATION_STATUSES } = require('../models/shiftReconciliationSchema');

const previewSchema = Joi.object({
    date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
    session: Joi.string().valid(...ATTENDANCE_SESSIONS).required(),
    parkZoneCode: Joi.string().trim().required(),
});

const submitSchema = Joi.object({
    date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
    session: Joi.string().valid(...ATTENDANCE_SESSIONS).required(),
    parkZoneCode: Joi.string().trim().required(),
    reportedCashAmount: Joi.number().min(0).required(),
    supervisorNotes: Joi.string().trim().max(1000).allow('').optional(),
});

const listSchema = Joi.object({
    status: Joi.string().valid('all', ...RECONCILIATION_STATUSES).optional(),
    zone: Joi.string().trim().allow('all', '').optional(),
    date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
    session: Joi.string().valid('all', ...ATTENDANCE_SESSIONS).optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
});

const reviewSchema = Joi.object({
    decision: Joi.string().valid('approve', 'reject').required(),
    reviewNote: Joi.string().trim().max(1000).allow('').optional(),
});

const preview = async (req, res) => {
    const result = await shiftReconciliationService.getReconciliationPreview(
        req.currentUser,
        req.validated?.query || req.query
    );
    res.json(result);
};

const submit = async (req, res) => {
    const record = await shiftReconciliationService.submitReconciliation(
        req.currentUser,
        req.validated.body,
        req
    );
    res.json({ message: 'Shift reconciliation submitted', reconciliation: record });
};

const list = async (req, res) => {
    const result = await shiftReconciliationService.listReconciliations(
        req.currentUser,
        req.validated?.query || req.query
    );
    res.json(result);
};

const review = async (req, res) => {
    const record = await shiftReconciliationService.reviewReconciliation(
        req.currentUser,
        req.params.id,
        req.validated.body,
        req
    );
    res.json({ message: 'Shift reconciliation reviewed', reconciliation: record });
};

module.exports = {
    previewSchema,
    submitSchema,
    listSchema,
    reviewSchema,
    preview,
    submit,
    list,
    review,
};
