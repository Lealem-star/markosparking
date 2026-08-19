const Joi = require('joi');
const attendanceService = require('../services/attendanceService');

const dateKeySchema = Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/);
const sessionSchema = Joi.string().valid(...attendanceService.ATTENDANCE_SESSIONS);

const getSessionSchema = Joi.object({
    date: dateKeySchema.optional(),
    session: sessionSchema.optional(),
});

const updateStatusSchema = Joi.object({
    dateKey: dateKeySchema.required(),
    session: sessionSchema.required(),
    status: Joi.string()
        .valid(...attendanceService.MARKABLE_STATUSES)
        .required(),
});

const finishSchema = Joi.object({
    dateKey: dateKeySchema.required(),
    session: sessionSchema.required(),
    markRemainingAbsent: Joi.boolean().required(),
});

const periodReportSchema = Joi.object({
    startDate: dateKeySchema.required(),
    endDate: dateKeySchema.required(),
    session: Joi.string().valid('all', ...attendanceService.ATTENDANCE_SESSIONS).optional(),
    zone: Joi.string().trim().optional(),
});

const getSession = async (req, res) => {
    const { date, session } = req.validated?.query || {};
    const result = await attendanceService.getAttendanceSession(
        req.currentUser,
        date,
        session
    );
    res.json(result);
};

const updateStatus = async (req, res) => {
    const result = await attendanceService.updateOfficerStatus(
        req.currentUser,
        req.params.officerId,
        req.validated.body
    );
    res.json(result);
};

const finish = async (req, res) => {
    const result = await attendanceService.finishAttendance(
        req.currentUser,
        req.validated.body
    );
    res.json(result);
};

const getPeriodReport = async (req, res) => {
    const { startDate, endDate, session, zone } = req.validated?.query || {};
    const result = await attendanceService.getAttendancePeriodReport(
        req.currentUser,
        { startDate, endDate, session, zone }
    );
    res.json(result);
};

module.exports = {
    getSessionSchema,
    updateStatusSchema,
    finishSchema,
    periodReportSchema,
    getSession,
    updateStatus,
    finish,
    getPeriodReport,
};
