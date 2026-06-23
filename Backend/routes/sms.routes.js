const { Router } = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { isLoggedIn, validate } = require('../middleware');
const smsController = require('../controllers/smsController');

const router = Router();

router.post(
    '/send',
    isLoggedIn,
    validate(smsController.sendSmsSchema),
    asyncHandler(smsController.send)
);

module.exports = router;
