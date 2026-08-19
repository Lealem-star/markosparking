const { Router } = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { isLoggedIn, attachCurrentUser, requireRoles, validate } = require('../middleware');
const { ROLES } = require('../constants/roles');
const attendanceController = require('../controllers/attendanceController');

const router = Router();

router.get(
    '/report',
    isLoggedIn,
    attachCurrentUser,
    requireRoles(ROLES.SUPERVISOR, ROLES.DIRECTOR, ROLES.FINANCE_OFFICER, ROLES.SYSTEM_ADMIN),
    validate(attendanceController.periodReportSchema, 'query'),
    asyncHandler(attendanceController.getPeriodReport)
);

router.get(
    '/',
    isLoggedIn,
    attachCurrentUser,
    requireRoles(ROLES.SUPERVISOR, ROLES.DIRECTOR, ROLES.FINANCE_OFFICER, ROLES.SYSTEM_ADMIN),
    validate(attendanceController.getSessionSchema, 'query'),
    asyncHandler(attendanceController.getSession)
);

router.put(
    '/officer/:officerId/status',
    isLoggedIn,
    attachCurrentUser,
    requireRoles(ROLES.SUPERVISOR),
    validate(attendanceController.updateStatusSchema),
    asyncHandler(attendanceController.updateStatus)
);

router.post(
    '/finish',
    isLoggedIn,
    attachCurrentUser,
    requireRoles(ROLES.SUPERVISOR),
    validate(attendanceController.finishSchema),
    asyncHandler(attendanceController.finish)
);

module.exports = router;
