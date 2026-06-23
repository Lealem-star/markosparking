const { Router } = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { isLoggedIn, validate } = require('../middleware');
const paymentController = require('../controllers/paymentController');

const router = Router();

router.post(
    '/chapa/initialize',
    isLoggedIn,
    validate(paymentController.initializeParkingSchema),
    asyncHandler(paymentController.initializeParking)
);

router.post(
    '/chapa/initialize-package',
    isLoggedIn,
    validate(paymentController.initializePackageSchema),
    asyncHandler(paymentController.initializePackage)
);

router.get('/chapa/verify/:txRef', asyncHandler(paymentController.verifyParking));
router.get('/chapa/verify-package/:txRef', asyncHandler(paymentController.verifyPackage));
router.post('/chapa/callback', asyncHandler(paymentController.callbackPost));
router.get('/chapa/callback', asyncHandler(paymentController.callbackGet));
router.post('/chapa/webhook', asyncHandler(paymentController.webhook));

module.exports = router;
