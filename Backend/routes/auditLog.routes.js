const { Router } = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { isLoggedIn, attachCurrentUser, requireRoles, validate } = require('../middleware');
const { ROLES } = require('../constants/roles');
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

module.exports = router;
