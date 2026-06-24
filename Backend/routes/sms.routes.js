const { Router } = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { isLoggedIn, attachCurrentUser, requireRoles, validate } = require('../middleware');
const smsController = require('../controllers/smsController');

const SMS_SENDER_ROLES = ['valet', 'admin', 'manager', 'system_admin'];

const router = Router();

router.post(
    '/send',
    isLoggedIn,
    attachCurrentUser,
    requireRoles(...SMS_SENDER_ROLES),
    validate(smsController.sendSmsSchema),
    asyncHandler(smsController.send)
);

module.exports = router;
