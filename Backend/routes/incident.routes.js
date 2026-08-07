const { Router } = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { isLoggedIn, attachCurrentUser, requireRoles, validate } = require('../middleware');
const { ROLES } = require('../constants/roles');
const incidentController = require('../controllers/incidentController');

const router = Router();

router.get(
    '/',
    isLoggedIn,
    attachCurrentUser,
    requireRoles(ROLES.SUPERVISOR),
    validate(incidentController.listSchema, 'query'),
    asyncHandler(incidentController.list)
);

router.post(
    '/',
    isLoggedIn,
    attachCurrentUser,
    requireRoles(ROLES.SUPERVISOR),
    validate(incidentController.createSchema),
    asyncHandler(incidentController.create)
);

router.patch(
    '/:id/assign',
    isLoggedIn,
    attachCurrentUser,
    requireRoles(ROLES.SUPERVISOR),
    validate(incidentController.assignSchema),
    asyncHandler(incidentController.assign)
);

router.patch(
    '/:id/resolve',
    isLoggedIn,
    attachCurrentUser,
    requireRoles(ROLES.SUPERVISOR),
    validate(incidentController.resolveSchema),
    asyncHandler(incidentController.resolve)
);

module.exports = router;
