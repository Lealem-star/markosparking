const { Router } = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { isLoggedIn, attachCurrentUser, requireRoles, validate } = require('../middleware');
const { ROLES, OFFICE_WIDE_DATA_ROLES } = require('../constants/roles');
const shiftReconciliationController = require('../controllers/shiftReconciliationController');

const router = Router();

const financeRoles = [...OFFICE_WIDE_DATA_ROLES];

router.get(
    '/preview',
    isLoggedIn,
    attachCurrentUser,
    requireRoles(ROLES.SUPERVISOR),
    validate(shiftReconciliationController.previewSchema, 'query'),
    asyncHandler(shiftReconciliationController.preview)
);

router.post(
    '/',
    isLoggedIn,
    attachCurrentUser,
    requireRoles(ROLES.SUPERVISOR),
    validate(shiftReconciliationController.submitSchema),
    asyncHandler(shiftReconciliationController.submit)
);

router.get(
    '/',
    isLoggedIn,
    attachCurrentUser,
    requireRoles(ROLES.SUPERVISOR, ...financeRoles),
    validate(shiftReconciliationController.listSchema, 'query'),
    asyncHandler(shiftReconciliationController.list)
);

router.patch(
    '/:id/review',
    isLoggedIn,
    attachCurrentUser,
    requireRoles(...financeRoles),
    validate(shiftReconciliationController.reviewSchema),
    asyncHandler(shiftReconciliationController.review)
);

module.exports = router;
