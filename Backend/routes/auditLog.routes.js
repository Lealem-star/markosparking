const { Router } = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { isLoggedIn, attachCurrentUser, requireRoles, validate } = require('../middleware');
const { ROLES, OFFICE_WIDE_DATA_ROLES } = require('../constants/roles');
const auditLogController = require('../controllers/auditLogController');

const router = Router();

router.get(
    '/',
    isLoggedIn,
    attachCurrentUser,
    requireRoles(ROLES.SYSTEM_ADMIN),
    validate(auditLogController.listSchema, 'query'),
    asyncHandler(auditLogController.listAuditLogs)
);

router.get(
    '/finance',
    isLoggedIn,
    attachCurrentUser,
    requireRoles(...OFFICE_WIDE_DATA_ROLES),
    validate(auditLogController.listSchema, 'query'),
    asyncHandler(auditLogController.listFinanceAuditLogs)
);

module.exports = router;
