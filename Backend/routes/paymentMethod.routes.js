const { Router } = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { isLoggedIn, attachCurrentUser, requireRoles, validate } = require('../middleware');
const paymentMethodController = require('../controllers/paymentMethodController');

const router = Router();

router.post(
    '/',
    isLoggedIn,
    attachCurrentUser,
    requireRoles('system_admin'),
    validate(paymentMethodController.createSchema),
    asyncHandler(paymentMethodController.create)
);

router.get('/', isLoggedIn, attachCurrentUser, requireRoles('system_admin'), asyncHandler(paymentMethodController.list));
router.put('/:id', isLoggedIn, attachCurrentUser, requireRoles('system_admin'), validate(paymentMethodController.updateSchema), asyncHandler(paymentMethodController.update));
router.delete('/:id', isLoggedIn, attachCurrentUser, requireRoles('system_admin'), asyncHandler(paymentMethodController.remove));

module.exports = router;
